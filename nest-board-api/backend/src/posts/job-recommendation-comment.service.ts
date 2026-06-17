import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { JobPostingsService } from "../job-postings/job-postings.service";
import type { JobPostingCandidate, JobSearchCriteria } from "../job-postings/job-search.types";
import { ChromaVectorService } from "../rag/chroma-vector.service";
import { RagService } from "../rag/rag.service";
import { hashPassword } from "../auth/password";
import { CAREER_TAG_NAME, hasCareerKeywordText } from "../common/career-keywords";
import { buildJobSearchCriteriaAttempts } from "./job-search-criteria";

const AUTO_JOB_COMMENT_PREFIX = "[AI 채용공고 추천]";
const AI_AGENT_EMAIL = "ai-agent@career-board.local";
const AI_AGENT_NAME = "AI 에이전트";
const DEFAULT_AUTO_JOB_COMMENT_COOLDOWN_HOURS = 24;
const DEFAULT_JOB_RECOMMENDATION_LIMIT = 3;
const MAX_AGENT_STEPS = 5;

type PostForJobRecommendation = {
  author: {
    id: string;
    name: string;
  };
  content: string;
  id: string;
  status: string;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  title: string;
};

type JobPostingForComment = {
  company: string;
  experience: string | null;
  id: string;
  location: string | null;
  skills: Prisma.JsonValue;
  title: string;
  url: string;
};

type JobRecommendationAgentState = {
  apiFailed: boolean;
  attempts: Array<{
    criteria: JobSearchCriteria;
    resultCount: number;
    source: "saramin-api";
  }>;
  criteriaAttempts: JobSearchCriteria[];
  fallbackUsed: boolean;
  selectedResults: JobPostingCandidate[];
  source?: "saramin-api" | "fallback-rag";
};

@Injectable()
export class JobRecommendationCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaVectorService: ChromaVectorService,
    private readonly jobPostingsService: JobPostingsService,
    private readonly ragService: RagService,
  ) {}

  async createForPost(post: PostForJobRecommendation) {
    if (!this.shouldRecommendJobs(post)) {
      return null;
    }

    try {
      const aiAgent = await this.findOrCreateAiAgent();

      if (!aiAgent) {
        return null;
      }

      if (await this.hasRecentAutoComment(post.author.id, aiAgent.id)) {
        return null;
      }

      return this.runAgentLoop(post, aiAgent.id);
    } catch {
      return null;
    }
  }

  private async runAgentLoop(post: PostForJobRecommendation, aiAgentId: string) {
    const state = this.createInitialAgentState(post);

    for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
      if (state.selectedResults.length > 0 && state.source) {
        return this.saveComment(post.id, aiAgentId, state.selectedResults, state.source);
      }

      if (state.criteriaAttempts.length > 0 && !state.apiFailed) {
        const criteria = state.criteriaAttempts.shift();

        if (!criteria) {
          continue;
        }

        try {
          const results = await this.jobPostingsService.searchSaraminJobPostings(criteria);
          state.attempts.push({
            criteria,
            resultCount: results.length,
            source: "saramin-api",
          });

          if (results.length >= DEFAULT_JOB_RECOMMENDATION_LIMIT) {
            state.selectedResults = results.slice(0, DEFAULT_JOB_RECOMMENDATION_LIMIT);
            state.source = "saramin-api";
          }
        } catch {
          state.apiFailed = true;
          state.criteriaAttempts = [];
        }

        continue;
      }

      if (!state.fallbackUsed) {
        state.fallbackUsed = true;
        const fallbackResults = await this.searchFallbackJobPostings(post);

        if (fallbackResults.length > 0) {
          state.selectedResults = fallbackResults.slice(0, DEFAULT_JOB_RECOMMENDATION_LIMIT);
          state.source = "fallback-rag";
        }

        continue;
      }

      return null;
    }

    if (state.selectedResults.length > 0 && state.source) {
      return this.saveComment(post.id, aiAgentId, state.selectedResults, state.source);
    }

    return null;
  }

  private createInitialAgentState(post: PostForJobRecommendation): JobRecommendationAgentState {
    return {
      apiFailed: false,
      attempts: [],
      criteriaAttempts: buildJobSearchCriteriaAttempts(post),
      fallbackUsed: false,
      selectedResults: [],
    };
  }

  private async findOrCreateAiAgent() {
    const email = process.env.AI_COMMENT_AUTHOR_EMAIL?.trim().toLowerCase() || AI_AGENT_EMAIL;

    return this.prisma.user.upsert({
      create: {
        email,
        name: AI_AGENT_NAME,
        passwordHash: await hashPassword(randomUUID()),
        role: "USER",
      },
      update: {
        name: AI_AGENT_NAME,
      },
      select: {
        id: true,
      },
      where: {
        email,
      },
    });
  }

  private async hasRecentAutoComment(postAuthorId: string, adminUserId: string) {
    const cooldownHours = this.autoCommentCooldownHours();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    if (cooldownMs <= 0) {
      return false;
    }

    const recentComment = await this.prisma.comment.findFirst({
      select: {
        id: true,
      },
      where: {
        authorId: adminUserId,
        content: {
          startsWith: AUTO_JOB_COMMENT_PREFIX,
        },
        createdAt: {
          gte: new Date(Date.now() - cooldownMs),
        },
        post: {
          authorId: postAuthorId,
        },
      },
    });

    return Boolean(recentComment);
  }

  private async searchFallbackJobPostings(post: PostForJobRecommendation): Promise<JobPostingCandidate[]> {
    const vectorResult = await this.ragService.upsertPostVector({
      ...post,
      author: {
        email: "",
        id: post.author.id,
        name: post.author.name,
      },
      excerpt: null,
    });

    if (!vectorResult.embedding) {
      return [];
    }

    const query = this.buildSearchQuery(post);
    const vectorMatches = await this.chromaVectorService.searchJobPostings(
      query,
      DEFAULT_JOB_RECOMMENDATION_LIMIT,
      vectorResult.embedding,
    );

    if (vectorMatches.length === 0) {
      return [];
    }

    const jobPostings = await this.prisma.jobPosting.findMany({
      select: {
        company: true,
        experience: true,
        id: true,
        location: true,
        skills: true,
        title: true,
        url: true,
      },
      where: {
        id: {
          in: vectorMatches.map((match) => match.id),
        },
        status: "ACTIVE",
      },
    });
    const jobPostingById = new Map(jobPostings.map((jobPosting) => [jobPosting.id, jobPosting]));

    return vectorMatches
      .flatMap((match) => {
        const jobPosting = jobPostingById.get(match.id);

        if (!jobPosting) {
          return [];
        }

        return [{
          company: jobPosting.company,
          experience: jobPosting.experience,
          location: jobPosting.location,
          skills: this.readSkills(jobPosting.skills),
          source: "fallback-rag" as const,
          title: jobPosting.title,
          url: jobPosting.url,
        }];
      });
  }

  private saveComment(
    postId: string,
    aiAgentId: string,
    matches: JobPostingCandidate[],
    source: "saramin-api" | "fallback-rag",
  ) {
    return this.prisma.comment.create({
      data: {
        authorId: aiAgentId,
        content: this.buildCommentContent(matches, source),
        postId,
      },
    });
  }

  private buildCommentContent(matches: JobPostingCandidate[], source: "saramin-api" | "fallback-rag") {
    const sourceLabel = source === "saramin-api" ? "사람인 API" : "fallback RAG";
    const lines = [
      AUTO_JOB_COMMENT_PREFIX,
      `${sourceLabel}로 이 글에 어울릴 만한 신입·주니어 개발자 공고 3개를 찾아봤어요.`,
      "",
      ...matches.flatMap((jobPosting, index) => [
        `${index + 1}. [${jobPosting.title}](${jobPosting.url})`,
        `   - 회사: ${jobPosting.company}`,
        `   - 위치/경력: ${[jobPosting.location, jobPosting.experience].filter(Boolean).join(" · ") || "공고 확인 필요"}`,
        `   - 기술: ${jobPosting.skills.join(", ") || "공고 확인 필요"}`,
      ]),
    ];

    return lines.join("\n");
  }

  private buildSearchQuery(post: PostForJobRecommendation) {
    return [
      post.title,
      ...post.tags.map((tagLink) => tagLink.tag.name),
      post.content,
    ]
      .filter(Boolean)
      .join(" ");
  }

  private shouldRecommendJobs(post: PostForJobRecommendation) {
    if (post.status !== "PUBLISHED") {
      return false;
    }

    return this.hasCareerTag(post) && this.hasCareerKeyword(post);
  }

  private hasCareerTag(post: PostForJobRecommendation) {
    return post.tags.some((tagLink) => tagLink.tag.name === CAREER_TAG_NAME);
  }

  private hasCareerKeyword(post: PostForJobRecommendation) {
    return hasCareerKeywordText(post.title, post.content);
  }

  private autoCommentCooldownHours() {
    const rawValue = Number(process.env.JOB_RECOMMENDATION_COMMENT_COOLDOWN_HOURS);

    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return DEFAULT_AUTO_JOB_COMMENT_COOLDOWN_HOURS;
    }

    return rawValue;
  }

  private readSkills(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
}

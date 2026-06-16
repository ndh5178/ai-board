import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ChromaVectorService } from "../rag/chroma-vector.service";
import { hashPassword } from "../auth/password";

const CAREER_TAG_NAME = "채용";
const AUTO_JOB_COMMENT_PREFIX = "[AI 채용공고 추천]";
const AI_AGENT_EMAIL = "ai-agent@career-board.local";
const AI_AGENT_NAME = "AI 에이전트";
const DEFAULT_AUTO_JOB_COMMENT_COOLDOWN_HOURS = 24;
const DEFAULT_JOB_RECOMMENDATION_LIMIT = 5;
const CAREER_KEYWORDS = [
  "취업",
  "채용",
  "공고",
  "지원",
  "이력서",
  "자소서",
  "포트폴리오",
  "면접",
  "서류",
  "합격",
  "불합격",
  "커리어",
  "신입",
  "주니어",
  "인턴",
  "개발자",
  "프론트엔드",
  "백엔드",
  "풀스택",
  "데이터",
  "데브옵스",
  "react",
  "typescript",
  "javascript",
  "node",
  "nestjs",
  "spring",
  "java",
  "python",
  "sql",
  "aws",
  "docker",
];

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

@Injectable()
export class JobRecommendationCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaVectorService: ChromaVectorService,
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

      const matches = await this.searchMatchingJobPostings(post);

      if (matches.length === 0) {
        return null;
      }

      return this.prisma.comment.create({
        data: {
          authorId: aiAgent.id,
          content: this.buildCommentContent(matches),
          postId: post.id,
        },
      });
    } catch {
      return null;
    }
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

  private async searchMatchingJobPostings(post: PostForJobRecommendation) {
    const query = this.buildSearchQuery(post);
    const vectorMatches = await this.chromaVectorService.searchJobPostings(query, DEFAULT_JOB_RECOMMENDATION_LIMIT);

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
      .map((match) => {
        const jobPosting = jobPostingById.get(match.id);

        if (!jobPosting) {
          return null;
        }

        return {
          jobPosting,
          score: match.score,
        };
      })
      .filter((match): match is { jobPosting: JobPostingForComment; score: number } => Boolean(match));
  }

  private buildCommentContent(matches: Array<{ jobPosting: JobPostingForComment; score: number }>) {
    const lines = [
      AUTO_JOB_COMMENT_PREFIX,
      "이 글과 비슷한 신입·주니어 개발자 공고를 찾아봤어요.",
      "",
      ...matches.flatMap(({ jobPosting }, index) => [
        `${index + 1}. [${jobPosting.title}](${jobPosting.url})`,
        `   - 회사: ${jobPosting.company}`,
        `   - 위치/경력: ${[jobPosting.location, jobPosting.experience].filter(Boolean).join(" · ") || "공고 확인 필요"}`,
        `   - 기술: ${this.readSkills(jobPosting.skills).join(", ") || "공고 확인 필요"}`,
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
    const searchableText = `${post.title} ${post.content}`.toLowerCase();

    return CAREER_KEYWORDS.some((keyword) => searchableText.includes(keyword));
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

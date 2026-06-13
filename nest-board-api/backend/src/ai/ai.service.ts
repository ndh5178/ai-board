import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { McpService } from "../mcp/mcp.service";
import type { ResearchResult, ResearchToolName, ResearchToolResult } from "../mcp/research-results";
import { getResearchToolLabel, selectResearchTools, type ResearchToolSelection } from "../mcp/research-tool-registry";
import { cosineSimilarity, createEmbedding } from "../rag/embedding";

const AI_RESEARCH_BOT_EMAIL = "ai-research-bot@local";
const AI_RESEARCH_BOT_NAME = "AI 자료 추천 봇";

type PostForAnalysis = {
  content: string;
  id: string;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  title: string;
};

type RankedResult = ResearchResult & {
  score: number;
  tool: ResearchToolName;
};

type TextStat = {
  content: string;
  kind: "post" | "comment";
  title?: string;
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mcpService: McpService,
  ) {}

  createJobMatchComment(postId: string, user: AuthUser) {
    return this.createResearchComment(postId, user);
  }

  async analyzeMyWritingStyle(user: AuthUser) {
    const [posts, comments] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          content: true,
          createdAt: true,
          id: true,
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
          title: true,
        },
        take: 100,
        where: {
          authorId: user.id,
          status: "PUBLISHED",
        },
      }),
      this.prisma.comment.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          content: true,
          createdAt: true,
          id: true,
          post: {
            select: {
              title: true,
            },
          },
        },
        take: 150,
        where: {
          authorId: user.id,
        },
      }),
    ]);
    const texts: TextStat[] = [
      ...posts.map((post) => ({
        content: `${post.title}\n${post.content}`,
        kind: "post" as const,
        title: post.title,
      })),
      ...comments.map((comment) => ({
        content: comment.content,
        kind: "comment" as const,
        title: comment.post.title,
      })),
    ];
    const joinedText = texts.map((text) => text.content).join("\n");
    const tokens = this.tokenizeKoreanFriendly(joinedText);
    const topKeywords = this.countTopWords(tokens);
    const tagCounts = this.countTags(posts.flatMap((post) => post.tags.map((tagLink) => tagLink.tag.name)));
    const totalCharacters = texts.reduce((sum, text) => sum + text.content.length, 0);
    const averagePostLength = this.average(posts.map((post) => post.content.length));
    const averageCommentLength = this.average(comments.map((comment) => comment.content.length));
    const questionRatio = this.ratio(
      texts.filter((text) => this.isQuestionLike(text.content)).length,
      Math.max(texts.length, 1),
    );
    const technicalRatio = this.ratio(
      texts.filter((text) => this.includesTechnicalKeyword(text.content)).length,
      Math.max(texts.length, 1),
    );

    return {
      analysis: {
        advice: this.buildWritingAdvice({
          averageCommentLength,
          averagePostLength,
          postCount: posts.length,
          questionRatio,
          technicalRatio,
        }),
        commentCount: comments.length,
        interestTags: tagCounts,
        postCount: posts.length,
        profile: this.buildStyleProfile({
          averageCommentLength,
          averagePostLength,
          postCount: posts.length,
          questionRatio,
          technicalRatio,
          totalTextCount: texts.length,
        }),
        questionRatio,
        summary: this.buildWritingSummary({
          averageCommentLength,
          averagePostLength,
          postCount: posts.length,
          questionRatio,
          technicalRatio,
          topKeywords,
        }),
        technicalRatio,
        topKeywords,
        totalCharacters,
        totalTextCount: texts.length,
      },
    };
  }

  async createResearchComment(postId: string, _user: AuthUser) {
    const post = await this.findPost(postId);

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    const existingComment = await this.findExistingAiComment(postId);

    if (existingComment) {
      return {
        comment: existingComment,
        created: false,
        message: "이미 AI 자료 추천 댓글이 작성되어 있습니다.",
      };
    }

    const tagNames = post.tags.map((tagLink) => tagLink.tag.name);
    const postText = this.buildPostText(post.title, post.content, tagNames);
    const toolPlans = selectResearchTools(
      {
        content: post.content,
        tags: tagNames,
        title: post.title,
      },
      3,
    );
    const toolResults = await this.runTools(postText, toolPlans);
    const rankedResults = this.rankResults(postText, toolResults).slice(0, 8);
    const botUser = await this.ensureBotUser();
    const content = this.buildCommentContent(rankedResults);
    const comment = await this.prisma.comment.create({
      data: {
        authorId: botUser.id,
        content,
        postId,
      },
      select: this.commentSelect(),
    });

    return {
      comment,
      created: true,
      matches: rankedResults,
      tools: toolPlans.map((plan) => plan.tool),
    };
  }

  private findPost(postId: string) {
    return this.prisma.post.findUnique({
      select: {
        content: true,
        id: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        title: true,
      },
      where: {
        id: postId,
      },
    });
  }

  private findExistingAiComment(postId: string) {
    return this.prisma.comment.findFirst({
      select: this.commentSelect(),
      where: {
        author: {
          email: {
            in: [AI_RESEARCH_BOT_EMAIL, "ai-job-bot@local"],
          },
        },
        postId,
      },
    });
  }

  private async ensureBotUser() {
    return this.prisma.user.upsert({
      create: {
        email: AI_RESEARCH_BOT_EMAIL,
        name: AI_RESEARCH_BOT_NAME,
        passwordHash: "disabled:ai-research-bot",
        role: "ADMIN",
      },
      update: {
        name: AI_RESEARCH_BOT_NAME,
        role: "ADMIN",
      },
      where: {
        email: AI_RESEARCH_BOT_EMAIL,
      },
    });
  }

  private buildPostText(title: string, content: string, tags: string[]) {
    return [title, content, ...tags].join(" ");
  }

  private async runTools(query: string, plans: ResearchToolSelection[]) {
    const results: ResearchToolResult[] = [];

    for (const plan of plans) {
      try {
        results.push(
          await this.mcpService.callResearchTool(plan.tool, {
            limit: 5,
            query,
          }),
        );
      } catch (error) {
        results.push({
          items: [
            {
              metadata: ["외부 API 호출 실패"],
              source: this.toolLabel(plan.tool),
              summary: error instanceof Error ? error.message : "외부 API 호출 중 알 수 없는 오류가 발생했습니다.",
              title: `${this.toolLabel(plan.tool)} 결과를 가져오지 못했습니다.`,
              url: "",
            },
          ],
          query,
          tool: plan.tool,
        });
      }
    }

    return results;
  }

  private rankResults(query: string, toolResults: ResearchToolResult[]) {
    const queryEmbedding = createEmbedding(query);
    const rankedResults: RankedResult[] = [];

    for (const result of toolResults) {
      for (const item of result.items) {
        rankedResults.push({
          ...item,
          score: cosineSimilarity(queryEmbedding, createEmbedding(this.buildResearchText(item))),
          tool: result.tool,
        });
      }
    }

    return rankedResults.sort((left, right) => right.score - left.score);
  }

  private buildResearchText(item: ResearchResult) {
    return [item.source, item.title, item.summary, ...item.metadata].join(" ");
  }

  private buildCommentContent(rankedResults: RankedResult[]) {
    return [
      "참고하면 좋을 자료를 찾아봤어요.",
      "",
      rankedResults.length > 0
        ? this.formatRankedResults(rankedResults.slice(0, 5))
        : "지금은 바로 추천할 만한 자료를 찾지 못했어요. 제목이나 본문에 에러 메시지, 기술명, 지역, 주제를 조금 더 구체적으로 적으면 더 잘 찾을 수 있어요.",
      "",
      "링크를 열어 원문을 확인하고, 필요한 부분만 골라서 적용해 보세요.",
    ].join("\n");
  }

  private formatRankedResults(results: RankedResult[]) {
    return results
      .map((result, index) => {
        return [
          `${index + 1}. ${result.title}`,
          `- 출처: ${result.source}`,
          `- 내용: ${this.summarizeForUser(result)}`,
          result.url ? `- 링크: [원문 보기](${result.url})` : "- 링크: 없음",
        ].join("\n");
      })
      .join("\n\n");
  }

  private summarizeForUser(result: RankedResult) {
    const metadata = result.metadata.filter(Boolean).slice(0, 3).join(", ");
    const summary = result.summary.trim();

    if (metadata && summary) {
      return `${summary} 관련 정보로 ${metadata}를 함께 확인할 수 있어요.`;
    }

    if (summary) {
      return summary;
    }

    if (metadata) {
      return `${metadata} 정보를 확인할 수 있어요.`;
    }

    return "게시글 주제와 관련해서 참고할 만한 자료입니다.";
  }

  private toolLabel(tool: ResearchToolName) {
    return getResearchToolLabel(tool);
  }

  private tokenizeKoreanFriendly(text: string) {
    const stopWords = new Set([
      "그리고",
      "그래서",
      "근데",
      "이거",
      "저거",
      "하는",
      "하면",
      "해서",
      "있어",
      "없는",
      "같아",
      "같은",
      "때문",
      "수",
      "것",
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !stopWords.has(token));
  }

  private countTopWords(tokens: string[]) {
    const counts = new Map<string, number>();

    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([word, count]) => ({
        count,
        word,
      }));
  }

  private countTags(tags: string[]) {
    const counts = new Map<string, number>();

    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        count,
        name,
      }));
  }

  private average(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private ratio(value: number, total: number) {
    return Number((value / total).toFixed(2));
  }

  private isQuestionLike(text: string) {
    return /[?？]|뭐|왜|어떻게|어떤|맞아|되나|될까|궁금|알려/.test(text);
  }

  private includesTechnicalKeyword(text: string) {
    return /react|next|nestjs|typescript|javascript|prisma|mariadb|mysql|api|db|rag|mcp|agent|llm|에러|오류|구현|코드/i.test(text);
  }

  private buildStyleProfile(input: {
    averageCommentLength: number;
    averagePostLength: number;
    postCount: number;
    questionRatio: number;
    technicalRatio: number;
    totalTextCount: number;
  }) {
    if (input.totalTextCount === 0) {
      return "아직 분석할 글이 부족합니다.";
    }

    const traits: string[] = [];

    if (input.questionRatio >= 0.45) {
      traits.push("질문을 통해 흐름을 잡는 탐색형");
    } else {
      traits.push("정리된 내용을 쌓아가는 기록형");
    }

    if (input.technicalRatio >= 0.5) {
      traits.push("기술 키워드를 자주 연결하는 실습 중심");
    }

    if (input.averagePostLength >= 500) {
      traits.push("긴 글로 맥락을 설명하는 편");
    } else if (input.averagePostLength > 0) {
      traits.push("짧게 핵심을 던지는 편");
    }

    return traits.join(" · ");
  }

  private buildWritingSummary(input: {
    averageCommentLength: number;
    averagePostLength: number;
    postCount: number;
    questionRatio: number;
    technicalRatio: number;
    topKeywords: Array<{ count: number; word: string }>;
  }) {
    if (input.postCount === 0 && input.topKeywords.length === 0) {
      return "아직 작성한 글이 많지 않아 스타일을 판단하기 어렵습니다. 글이나 댓글을 조금 더 쌓으면 더 정확한 분석이 가능합니다.";
    }

    const topWords = input.topKeywords
      .slice(0, 4)
      .map((keyword) => keyword.word)
      .join(", ");

    return [
      `최근 작성한 글과 댓글을 보면 ${topWords || "반복 키워드"} 쪽에 관심이 자주 나타납니다.`,
      input.questionRatio >= 0.45
        ? "질문형 문장이 많은 편이라, 모르는 지점을 바로 드러내면서 학습하는 스타일입니다."
        : "질문보다 정리형 문장이 많아, 알게 된 내용을 기록하면서 이해를 다지는 스타일입니다.",
      input.technicalRatio >= 0.5
        ? "기술명과 구현 관련 단어가 자주 보여 실제 코드와 연결해서 생각하는 경향이 강합니다."
        : "기술명보다는 생각이나 상황 설명이 더 많이 보여 맥락 중심으로 글을 쓰는 편입니다.",
    ].join(" ");
  }

  private buildWritingAdvice(input: {
    averageCommentLength: number;
    averagePostLength: number;
    postCount: number;
    questionRatio: number;
    technicalRatio: number;
  }) {
    const advice: string[] = [];

    if (input.postCount < 3) {
      advice.push("글이 아직 적어서, 배운 내용을 짧게라도 꾸준히 남기면 분석 품질이 좋아집니다.");
    }

    if (input.questionRatio >= 0.45) {
      advice.push("질문을 쓸 때는 현재 상황, 시도한 코드, 기대한 결과, 실제 결과를 함께 적으면 답변을 받기 쉬워집니다.");
    } else {
      advice.push("정리형 글 끝에 남은 질문을 한두 개 붙이면 다음 학습 방향이 더 선명해집니다.");
    }

    if (input.technicalRatio >= 0.5) {
      advice.push("기술 키워드가 많으니, 왜 그 기술을 선택했는지까지 적으면 포트폴리오 글로도 좋아집니다.");
    } else {
      advice.push("상황 설명이 좋으니, 관련 기술명이나 파일명을 함께 적으면 나중에 다시 찾기 쉬워집니다.");
    }

    if (input.averagePostLength > 0 && input.averagePostLength < 250) {
      advice.push("게시글이 짧은 편이라 예시 코드나 오류 메시지를 조금 더 붙이면 글의 정보량이 좋아집니다.");
    }

    return advice.slice(0, 4);
  }

  private commentSelect() {
    return {
      author: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
      content: true,
      createdAt: true,
      id: true,
      postId: true,
      updatedAt: true,
    };
  }
}

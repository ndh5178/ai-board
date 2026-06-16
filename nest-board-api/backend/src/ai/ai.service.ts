import { createHash } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

const STYLE_ANALYSIS_TAG_NAME = "스타일 분석";
const MIN_STYLE_ANALYSIS_POST_COUNT = 10;
const MAX_STYLE_ANALYSIS_POST_COUNT = 30;
const OPENAI_CHAT_COMPLETIONS_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_WRITING_STYLE_ANALYSIS_COOLDOWN_HOURS = 24;
const WRITING_STYLE_ANALYSIS_SCHEMA_VERSION = 2;

type LlmWritingStyleAnalysis = {
  advice: string[];
  profile: string;
  summary: string;
  writingTypes: WritingTypeAnalysis[];
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type WritingStylePost = {
  content: string;
  createdAt: Date;
  id: string;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  title: string;
  updatedAt: Date;
};

type WritingStyleAnalysisResult = {
  advice: string[];
  averageCommentLength: number;
  averagePostLength: number;
  commentCount: number;
  interestTags: Array<{ count: number; name: string }>;
  postCount: number;
  profile: string;
  questionRatio: number;
  summary: string;
  technicalRatio: number;
  topKeywords: Array<{ count: number; word: string }>;
  totalCharacters: number;
  totalTextCount: number;
  writingTypes: WritingTypeAnalysis[];
};

type WritingTypeAnalysis = {
  count: number;
  description: string;
  titles: string[];
  type: string;
};

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeMyWritingStyle(user: AuthUser) {
    const where = {
      authorId: user.id,
      status: "PUBLISHED" as const,
      tags: {
        some: {
          tag: {
            name: STYLE_ANALYSIS_TAG_NAME,
          },
        },
      },
    };
    const [totalPostCount, posts] = await Promise.all([
      this.prisma.post.count({
        where,
      }),
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
          updatedAt: true,
        },
        take: MAX_STYLE_ANALYSIS_POST_COUNT,
        where,
      }),
    ]);

    if (totalPostCount < MIN_STYLE_ANALYSIS_POST_COUNT) {
      throw new BadRequestException(
        `${STYLE_ANALYSIS_TAG_NAME} 태그가 붙은 게시글이 ${MIN_STYLE_ANALYSIS_POST_COUNT}개 이상 필요합니다. 현재 ${totalPostCount}개입니다.`,
      );
    }

    const sourceHash = this.createSourceHash(totalPostCount, posts);
    const latestAnalysis = await this.prisma.writingStyleAnalysis.findFirst({
      orderBy: {
        analyzedAt: "desc",
      },
      where: {
        userId: user.id,
      },
    });
    const cachedAnalysis = latestAnalysis ? this.readCachedAnalysis(latestAnalysis.result) : null;

    if (latestAnalysis?.sourceHash === sourceHash && cachedAnalysis) {
      return {
        analysis: cachedAnalysis,
      };
    }

    if (cachedAnalysis) {
      this.assertAnalysisCooldown(latestAnalysis?.analyzedAt);
    }

    const joinedText = posts.map((post) => `${post.title}\n${post.content}`).join("\n");
    const tokens = this.tokenizeKoreanFriendly(joinedText);
    const topKeywords = this.countTopWords(tokens);
    const tagCounts = this.countTags(posts.flatMap((post) => post.tags.map((tagLink) => tagLink.tag.name)));
    const totalCharacters = posts.reduce((sum, post) => sum + post.title.length + post.content.length, 0);
    const averagePostLength = this.average(posts.map((post) => post.content.length));
    const llmAnalysis = await this.requestWritingStyleAnalysis({
      posts,
      topKeywords,
    });
    const analysis: WritingStyleAnalysisResult = {
      advice: llmAnalysis.advice,
      averageCommentLength: 0,
      averagePostLength,
      commentCount: 0,
      interestTags: tagCounts,
      postCount: totalPostCount,
      profile: llmAnalysis.profile,
      questionRatio: 0,
      summary: llmAnalysis.summary,
      technicalRatio: 0,
      topKeywords,
      totalCharacters,
      totalTextCount: totalPostCount,
      writingTypes: llmAnalysis.writingTypes,
    };

    await this.prisma.writingStyleAnalysis.create({
      data: {
        postCount: totalPostCount,
        result: analysis,
        sourceHash,
        userId: user.id,
      },
    });

    return {
      analysis,
    };
  }

  private async requestWritingStyleAnalysis(input: {
    posts: WritingStylePost[];
    topKeywords: Array<{ count: number; word: string }>;
  }): Promise<LlmWritingStyleAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_CHAT_MODEL;

    if (!apiKey) {
      throw new BadRequestException("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.");
    }

    if (!model) {
      throw new BadRequestException("OPENAI_CHAT_MODEL 환경변수가 설정되어 있지 않습니다.");
    }

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_API_URL, {
      body: JSON.stringify({
        messages: [
          {
            content:
              "너는 사용자의 글쓰기 스타일을 분석하는 한국어 코치다. 반드시 JSON만 반환하고, 코드블록이나 설명 문장을 붙이지 않는다.",
            role: "system",
          },
          {
            content: this.buildWritingStylePrompt(input),
            role: "user",
          },
        ],
        model,
        response_format: {
          type: "json_object",
        },
        temperature: 0.3,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }).catch(() => {
      throw new BadRequestException("OpenAI 글쓰기 분석 요청에 연결할 수 없습니다.");
    });
    const payload = (await response.json().catch(() => ({}))) as OpenAiChatCompletionResponse;

    if (!response.ok) {
      throw new BadRequestException(payload.error?.message ?? `OpenAI 글쓰기 분석 요청에 실패했습니다. (${response.status})`);
    }

    return this.readLlmWritingStyleAnalysis(payload.choices?.[0]?.message?.content);
  }

  private buildWritingStylePrompt(input: {
    posts: WritingStylePost[];
    topKeywords: Array<{ count: number; word: string }>;
  }) {
    const postsText = input.posts
      .map((post, index) => {
        const tags = post.tags.map((tagLink) => tagLink.tag.name).join(", ") || "없음";

        return [
          `게시글 ${index + 1}`,
          `작성일: ${post.createdAt.toISOString().slice(0, 10)}`,
          `제목: ${post.title}`,
          `태그: ${tags}`,
          "본문:",
          post.content,
        ].join("\n");
      })
      .join("\n\n---\n\n");
    const topKeywords = input.topKeywords.map((keyword) => `${keyword.word}(${keyword.count})`).join(", ") || "없음";

    return `
아래는 사용자가 직접 "스타일 분석" 태그를 붙인 게시글 목록이다.
이 글들만 근거로 사용자의 글쓰기 스타일을 분석해라.
각 게시글을 아래 유형 중 가장 가까운 유형 1개 이상으로 분류하고, 유형별 개수와 해당 게시글 제목을 함께 반환해라.

참고 통계:
- 자주 쓰는 단어: ${topKeywords}

사용할 수 있는 글 유형:
- 질문형: 모르는 점, 원인, 방법을 묻고 답을 찾는 글
- 회고형: 배운 점, 느낀 점, 이전과 달라진 점을 돌아보는 글
- 계획형: 앞으로 할 일, 목표, 개선 방향을 정하는 글
- 문제해결형: 문제 상황, 원인 추적, 시도, 해결 과정을 정리하는 글
- 정보정리형: 개념, 구조, 흐름, 차이점, 기준을 정리하는 글
- 감정표현형: 막막함, 자신감, 흥미, 걱정, 만족감 같은 감정을 드러내는 글
- 실습기록형: 직접 구현하거나 실행한 과정과 결과를 기록하는 글

반드시 다음 JSON 형식으로만 답해라.
{
  "profile": "한 줄 스타일 요약",
  "summary": "사용자의 글쓰기 스타일, 관심사, 학습 방식에 대한 3~5문장 분석",
  "advice": ["다음 글을 더 좋게 쓰기 위한 조언 1", "조언 2", "조언 3"],
  "writingTypes": [
    {
      "type": "정보정리형",
      "count": 3,
      "description": "이 유형이 사용자의 글에서 어떤 특징으로 나타나는지 한 문장 설명",
      "titles": ["해당 유형으로 판단한 게시글 제목 1", "게시글 제목 2"]
    }
  ]
}

게시글 목록:
${postsText}
`.trim();
  }

  private readLlmWritingStyleAnalysis(content: string | undefined): LlmWritingStyleAnalysis {
    if (!content) {
      throw new BadRequestException("OpenAI 글쓰기 분석 응답이 비어 있습니다.");
    }

    let parsed: Partial<LlmWritingStyleAnalysis>;

    try {
      parsed = JSON.parse(content) as Partial<LlmWritingStyleAnalysis>;
    } catch {
      throw new BadRequestException("OpenAI 글쓰기 분석 응답을 JSON으로 해석할 수 없습니다.");
    }
    const advice = Array.isArray(parsed.advice)
      ? parsed.advice.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 4)
      : [];
    const writingTypes = this.readWritingTypes(parsed.writingTypes);

    if (
      typeof parsed.profile !== "string" ||
      typeof parsed.summary !== "string" ||
      advice.length === 0 ||
      writingTypes.length === 0
    ) {
      throw new BadRequestException("OpenAI 글쓰기 분석 응답 형식이 올바르지 않습니다.");
    }

    return {
      advice,
      profile: parsed.profile,
      summary: parsed.summary,
      writingTypes,
    };
  }

  private createSourceHash(totalPostCount: number, posts: WritingStylePost[]) {
    const source = posts.map((post) => ({
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      id: post.id,
      tags: post.tags.map((tagLink) => tagLink.tag.name).sort(),
      title: post.title,
      updatedAt: post.updatedAt.toISOString(),
    }));

    return createHash("sha256")
      .update(
        JSON.stringify({
          maxPostCount: MAX_STYLE_ANALYSIS_POST_COUNT,
          posts: source,
          schemaVersion: WRITING_STYLE_ANALYSIS_SCHEMA_VERSION,
          tagName: STYLE_ANALYSIS_TAG_NAME,
          totalPostCount,
        }),
      )
      .digest("hex");
  }

  private readCachedAnalysis(result: unknown): WritingStyleAnalysisResult | null {
    if (!result || typeof result !== "object") {
      return null;
    }

    const candidate = result as Partial<WritingStyleAnalysisResult>;

    if (
      typeof candidate.profile !== "string" ||
      typeof candidate.summary !== "string" ||
      !Array.isArray(candidate.advice) ||
      !Array.isArray(candidate.writingTypes)
    ) {
      return null;
    }

    const writingTypes = this.readWritingTypes(candidate.writingTypes);

    if (writingTypes.length === 0) {
      return null;
    }

    return {
      advice: candidate.advice.filter((item): item is string => typeof item === "string"),
      averageCommentLength: Number(candidate.averageCommentLength ?? 0),
      averagePostLength: Number(candidate.averagePostLength ?? 0),
      commentCount: Number(candidate.commentCount ?? 0),
      interestTags: Array.isArray(candidate.interestTags) ? candidate.interestTags : [],
      postCount: Number(candidate.postCount ?? 0),
      profile: candidate.profile,
      questionRatio: Number(candidate.questionRatio ?? 0),
      summary: candidate.summary,
      technicalRatio: Number(candidate.technicalRatio ?? 0),
      topKeywords: Array.isArray(candidate.topKeywords) ? candidate.topKeywords : [],
      totalCharacters: Number(candidate.totalCharacters ?? 0),
      totalTextCount: Number(candidate.totalTextCount ?? 0),
      writingTypes,
    };
  }

  private readWritingTypes(value: unknown): WritingTypeAnalysis[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Partial<WritingTypeAnalysis>;
        const type = typeof candidate.type === "string" ? candidate.type.trim() : "";
        const description = typeof candidate.description === "string" ? candidate.description.trim() : "";
        const count = Number(candidate.count);
        const titles = Array.isArray(candidate.titles)
          ? candidate.titles.filter((title): title is string => typeof title === "string" && title.trim().length > 0)
          : [];

        if (!type || !description || !Number.isFinite(count) || count < 1 || titles.length === 0) {
          return null;
        }

        return {
          count: Math.round(count),
          description,
          titles: [...new Set(titles)].slice(0, 8),
          type,
        };
      })
      .filter((item): item is WritingTypeAnalysis => Boolean(item))
      .slice(0, 7);
  }

  private assertAnalysisCooldown(latestAnalyzedAt: Date | undefined) {
    if (!latestAnalyzedAt) {
      return;
    }

    const cooldownHours = this.writingStyleAnalysisCooldownHours();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    if (cooldownMs <= 0) {
      return;
    }

    const elapsedMs = Date.now() - latestAnalyzedAt.getTime();

    if (elapsedMs >= cooldownMs) {
      return;
    }

    const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / 1000 / 60);

    throw new BadRequestException(
      `글이 바뀐 뒤 재분석은 ${cooldownHours}시간에 한 번만 가능합니다. 약 ${remainingMinutes}분 뒤 다시 시도해주세요.`,
    );
  }

  private writingStyleAnalysisCooldownHours() {
    const rawValue = Number(process.env.WRITING_STYLE_ANALYSIS_COOLDOWN_HOURS);

    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return DEFAULT_WRITING_STYLE_ANALYSIS_COOLDOWN_HOURS;
    }

    return rawValue;
  }

  private tokenizeKoreanFriendly(text: string) {
    const stopWords = new Set([
      "그리고",
      "그래서",
      "그런데",
      "이거",
      "저거",
      "하는",
      "하면",
      "에서",
      "있어",
      "없는",
      "같아",
      "같은",
      "때문",
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

}

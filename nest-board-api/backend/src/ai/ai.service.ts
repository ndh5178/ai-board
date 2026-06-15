import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

type TextStat = {
  content: string;
  kind: "post" | "comment";
  title?: string;
};

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeMyWritingStyle(user: AuthUser) {
    const [posts, comments] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          content: true,
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
          averagePostLength,
          postCount: posts.length,
          questionRatio,
          technicalRatio,
        }),
        commentCount: comments.length,
        interestTags: tagCounts,
        postCount: posts.length,
        profile: this.buildStyleProfile({
          averagePostLength,
          questionRatio,
          technicalRatio,
          totalTextCount: texts.length,
        }),
        questionRatio,
        summary: this.buildWritingSummary({
          postCount: posts.length,
          questionRatio,
          technicalRatio,
          topKeywords,
        }),
        technicalRatio,
        topKeywords,
        totalCharacters,
        totalTextCount: texts.length,
        averageCommentLength,
        averagePostLength,
      },
    };
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

  private ratio(value: number, total: number) {
    return Number((value / total).toFixed(2));
  }

  private isQuestionLike(text: string) {
    return /[?？]|뭐|왜|어떻게|어떤|맞아|하나|할까|궁금|알려/.test(text);
  }

  private includesTechnicalKeyword(text: string) {
    return /react|next|nestjs|typescript|javascript|prisma|mariadb|mysql|api|db|rag|mcp|agent|llm|에러|오류|구현|코드/i.test(
      text,
    );
  }

  private buildStyleProfile(input: {
    averagePostLength: number;
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
      traits.push("정리한 내용을 쌓아가는 기록형");
    }

    if (input.technicalRatio >= 0.5) {
      traits.push("기술 키워드를 자주 연결하는 실습 중심");
    }

    if (input.averagePostLength >= 500) {
      traits.push("긴 글로 맥락을 설명하는 편");
    } else if (input.averagePostLength > 0) {
      traits.push("짧게 핵심을 남기는 편");
    }

    return traits.join(" · ");
  }

  private buildWritingSummary(input: {
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
      `최근 작성한 글과 댓글에서는 ${topWords || "반복 키워드"} 쪽에 관심이 자주 나타납니다.`,
      input.questionRatio >= 0.45
        ? "질문형 문장이 많아 모르는 지점을 바로 드러내며 학습하는 스타일입니다."
        : "질문보다 정리형 문장이 많아, 알게 된 내용을 기록하며 이해를 다지는 스타일입니다.",
      input.technicalRatio >= 0.5
        ? "기술명과 구현 관련 단어가 자주 보여 실제 코드와 연결해서 생각하는 경향이 강합니다."
        : "기술명보다는 상황 설명이나 생각 정리가 많이 보여 맥락 중심으로 글을 쓰는 편입니다.",
    ].join(" ");
  }

  private buildWritingAdvice(input: {
    averagePostLength: number;
    postCount: number;
    questionRatio: number;
    technicalRatio: number;
  }) {
    const advice: string[] = [];

    if (input.postCount < 3) {
      advice.push("글이 아직 적어서 배운 내용을 짧게라도 꾸준히 남기면 분석 품질이 좋아집니다.");
    }

    if (input.questionRatio >= 0.45) {
      advice.push("질문을 올릴 때 현재 상황, 시도한 코드, 기대한 결과, 실제 결과를 함께 적으면 답변받기 쉬워집니다.");
    } else {
      advice.push("정리 글 끝에 남은 질문을 한두 개 붙이면 다음 학습 방향이 더 선명해집니다.");
    }

    if (input.technicalRatio >= 0.5) {
      advice.push("기술 키워드가 많으니 왜 그 기술을 선택했는지까지 적으면 포트폴리오 글로도 좋아집니다.");
    } else {
      advice.push("상황 설명이 좋으니 관련 기술명이나 파일명을 함께 적으면 나중에 다시 찾기 쉬워집니다.");
    }

    if (input.averagePostLength > 0 && input.averagePostLength < 250) {
      advice.push("게시글이 짧은 편이라 예시 코드나 오류 메시지를 조금 더 붙이면 정보량이 좋아집니다.");
    }

    return advice.slice(0, 4);
  }
}

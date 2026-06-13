import type { ResearchToolResult } from "./research-results";

type StackOverflowItem = {
  answer_count?: unknown;
  is_answered?: unknown;
  link?: unknown;
  score?: unknown;
  tags?: unknown;
  title?: unknown;
  view_count?: unknown;
};

type StackOverflowResponse = {
  items?: unknown;
};

const DEFAULT_STACKOVERFLOW_API_URL = "https://api.stackexchange.com/2.3/search/advanced";

export async function searchStackOverflow(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.STACKOVERFLOW_API_URL ?? DEFAULT_STACKOVERFLOW_API_URL);
  url.searchParams.set("order", "desc");
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("site", "stackoverflow");
  url.searchParams.set("q", query);
  url.searchParams.set("pagesize", String(Math.min(limit, 10)));

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Stack Overflow API 요청에 실패했습니다. (${response.status})`);
  }

  const payload = (await response.json()) as StackOverflowResponse;
  const items = Array.isArray(payload.items) ? payload.items.filter(isStackOverflowItem) : [];

  return {
    items: items.map((item) => ({
      metadata: [
        `답변 ${readNumber(item.answer_count)}`,
        `점수 ${readNumber(item.score)}`,
        `조회 ${readNumber(item.view_count)}`,
        readBoolean(item.is_answered) ? "답변 채택/해결 가능성 있음" : "미해결 또는 확인 필요",
        ...readTags(item.tags).slice(0, 4).map((tag) => `#${tag}`),
      ],
      source: "Stack Overflow",
      summary: "비슷한 개발 질문입니다. 에러 메시지, 사용 기술, 해결 방향을 비교해 볼 수 있습니다.",
      title: decodeHtml(readString(item.title) ?? "제목 없음"),
      url: readString(item.link) ?? "https://stackoverflow.com",
    })),
    query,
    tool: "stackoverflow_search",
  };
}

function isStackOverflowItem(value: unknown): value is StackOverflowItem {
  return Boolean(value && typeof value === "object" && readString((value as StackOverflowItem).title));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: unknown) {
  return value === true;
}

function readTags(value: unknown) {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string") : [];
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "nest-ai-board/0.1",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

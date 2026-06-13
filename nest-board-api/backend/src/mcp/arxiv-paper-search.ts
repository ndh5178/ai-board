import type { ResearchToolResult } from "./research-results";

const DEFAULT_ARXIV_API_URL = "https://export.arxiv.org/api/query";

export async function searchArxivPapers(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.ARXIV_API_URL ?? DEFAULT_ARXIV_API_URL);
  url.searchParams.set("search_query", `all:${query}`);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", String(Math.min(limit, 10)));
  url.searchParams.set("sortBy", "relevance");
  url.searchParams.set("sortOrder", "descending");

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`arXiv API 요청에 실패했습니다. (${response.status})`);
  }

  const xml = await response.text();

  return {
    items: readEntries(xml).map((entry) => ({
      metadata: [`published ${entry.published || "unknown"}`, `authors ${entry.authors.join(", ") || "unknown"}`],
      source: "arXiv",
      summary: entry.summary || "관련 논문 초록을 확인해 볼 수 있습니다.",
      title: entry.title || "arXiv paper",
      url: entry.url || "https://arxiv.org",
    })),
    query,
    tool: "arxiv_paper_search",
  };
}

function readEntries(xml: string) {
  const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entryMatches.map((entryXml) => ({
    authors: readAuthors(entryXml),
    published: readTag(entryXml, "published").slice(0, 10),
    summary: normalizeText(readTag(entryXml, "summary")),
    title: normalizeText(readTag(entryXml, "title")),
    url: readTag(entryXml, "id"),
  }));
}

function readAuthors(entryXml: string) {
  const authorMatches = entryXml.match(/<author>[\s\S]*?<\/author>/g) ?? [];

  return authorMatches.map((authorXml) => normalizeText(readTag(authorXml, "name"))).filter(Boolean).slice(0, 3);
}

function readTag(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`));

  return match ? decodeXml(match[1]) : "";
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    return await fetch(url, {
      headers: {
        Accept: "application/atom+xml",
        "User-Agent": "nest-ai-board/0.1",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

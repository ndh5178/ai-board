import type { ResearchToolResult } from "./research-results";

type GitHubRepository = {
  description?: unknown;
  html_url?: unknown;
  language?: unknown;
  name?: unknown;
  stargazers_count?: unknown;
};

type GitHubSearchResponse = {
  items?: unknown;
};

const DEFAULT_GITHUB_API_URL = "https://api.github.com/search/repositories";

export async function searchGitHubRepositories(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.GITHUB_REPO_SEARCH_API_URL ?? DEFAULT_GITHUB_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(Math.min(limit, 10)));

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`GitHub API 요청에 실패했습니다. (${response.status})`);
  }

  const payload = (await response.json()) as GitHubSearchResponse;
  const items = Array.isArray(payload.items) ? payload.items.filter(isGitHubRepository) : [];

  return {
    items: items.map((repo) => ({
      metadata: [
        `stars ${readNumber(repo.stargazers_count)}`,
        `language ${readString(repo.language) ?? "unknown"}`,
      ],
      source: "GitHub",
      summary: readString(repo.description) ?? "관련 코드를 참고할 수 있는 GitHub 저장소입니다.",
      title: readString(repo.name) ?? "GitHub repository",
      url: readString(repo.html_url) ?? "https://github.com",
    })),
    query,
    tool: "github_repo_search",
  };
}

function isGitHubRepository(value: unknown): value is GitHubRepository {
  return Boolean(value && typeof value === "object" && readString((value as GitHubRepository).html_url));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nest-ai-board/0.1",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    return await fetch(url, {
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

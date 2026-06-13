import { searchArxivPapers } from "./arxiv-paper-search";
import { searchGitHubRepositories } from "./github-repo-search";
import type { ResearchResult, ResearchToolName, ResearchToolResult } from "./research-results";
import { searchStackOverflow } from "./stackoverflow-search";
import { lookupWeather } from "./weather-lookup";

type ResearchToolRunner = (query: string, limit: number, location?: string) => Promise<ResearchToolResult>;

export type ResearchToolSpec = {
  description: string;
  keywords: string[];
  label: string;
  name: ResearchToolName;
  requiredEnv?: string[];
  run: ResearchToolRunner;
};

export type ResearchToolSelectionInput = {
  content: string;
  tags: string[];
  title: string;
};

export type ResearchToolSelection = {
  matchedKeywords: string[];
  reason: string;
  score: number;
  tool: ResearchToolName;
};

const DEFAULT_RESEARCH_LIMIT = 5;

const researchTools: ResearchToolSpec[] = [
  {
    description: "개발 에러, 프레임워크 문제, 구현 질문과 비슷한 Stack Overflow 질문을 찾습니다.",
    keywords: ["error", "exception", "bug", "에러", "오류", "버그", "안돼", "안됨", "prisma", "nestjs", "react", "typescript", "javascript", "api", "db", "database"],
    label: "Stack Overflow 질문 검색",
    name: "stackoverflow_search",
    run: (query, limit) => searchStackOverflow(query, limit),
  },
  {
    description: "참고할 만한 GitHub 저장소, 예제 코드, 스타터 프로젝트를 찾습니다.",
    keywords: ["github", "repo", "repository", "starter", "template", "example", "예제", "코드", "구현", "프로젝트", "react", "nestjs", "next", "typescript", "prisma"],
    label: "GitHub 저장소 검색",
    name: "github_repo_search",
    run: (query, limit) => searchGitHubRepositories(query, limit),
  },
  {
    description: "AI, RAG, LLM, Agent 같은 연구 주제에 맞는 arXiv 논문을 찾습니다.",
    keywords: ["ai", "llm", "rag", "mcp", "agent", "논문", "연구", "모델", "transformer", "embedding", "machine learning", "딥러닝"],
    label: "arXiv 논문 검색",
    name: "arxiv_paper_search",
    run: (query, limit) => searchArxivPapers(query, limit),
  },
  {
    description: "모임, 일정, 야외 활동 글에 필요한 주요 지역 날씨를 조회합니다.",
    keywords: ["날씨", "모임", "일정", "여행", "외출", "야외", "비", "눈", "서울", "부산", "제주", "대전", "대구", "광주", "인천", "weather"],
    label: "Open-Meteo 날씨 조회",
    name: "weather_lookup",
    run: (query, _limit, location) => lookupWeather(query, location),
  },
  {
    description: "글에 나온 개념이나 용어를 Wikipedia 기반으로 설명할 자료를 찾습니다.",
    keywords: [
      "뜻",
      "개념",
      "설명",
      "정의",
      "뭐야",
      "무엇",
      "차이",
      "역사",
      "위키",
      "wiki",
      "wikipedia",
      "용어",
      "야구",
      "축구",
      "농구",
      "배구",
      "스포츠",
      "경기",
      "선수",
      "팀",
      "리그",
      "kbo",
      "baseball",
      "football",
      "basketball",
    ],
    label: "Wikipedia 개념 검색",
    name: "wikipedia_search",
    run: searchWikipedia,
  },
  {
    description: "공부 주제와 관련된 책을 Open Library에서 찾습니다.",
    keywords: ["책", "도서", "읽을", "공부", "학습", "book", "books", "library", "독서", "추천"],
    label: "Open Library 책 검색",
    name: "open_library_search",
    run: searchOpenLibrary,
  },
  {
    description: "Google Books에서 책과 저자, 출판 정보를 찾습니다.",
    keywords: ["책", "도서", "저자", "출판", "book", "google books", "교재", "입문서"],
    label: "Google Books 책 검색",
    name: "google_books_search",
    run: searchGoogleBooks,
  },
  {
    description: "Crossref에서 논문과 학술 메타데이터를 찾습니다.",
    keywords: ["논문", "학술", "doi", "journal", "paper", "citation", "인용", "연구", "article"],
    label: "Crossref 학술자료 검색",
    name: "crossref_search",
    run: searchCrossref,
  },
  {
    description: "OpenAlex에서 논문, 연구 주제, 저자 정보를 찾습니다.",
    keywords: ["논문", "연구", "저자", "openalex", "학술", "paper", "citation", "topic", "institution"],
    label: "OpenAlex 연구자료 검색",
    name: "openalex_search",
    run: searchOpenAlex,
  },
  {
    description: "Semantic Scholar에서 논문과 인용 정보를 찾습니다.",
    keywords: ["논문", "연구", "semantic scholar", "paper", "citation", "인용", "abstract", "ai", "llm"],
    label: "Semantic Scholar 논문 검색",
    name: "semantic_scholar_search",
    run: searchSemanticScholar,
  },
  {
    description: "DEV.to 개발 블로그 글을 찾아 학습 글과 예제를 추천합니다.",
    keywords: ["블로그", "개발글", "devto", "dev.to", "튜토리얼", "tutorial", "article", "frontend", "backend", "javascript", "react", "nestjs"],
    label: "DEV.to 개발 글 검색",
    name: "devto_search",
    run: searchDevto,
  },
  {
    description: "Hacker News에서 개발, 스타트업, 기술 토론 글을 찾습니다.",
    keywords: ["hacker news", "hn", "스타트업", "기술뉴스", "개발뉴스", "discussion", "토론", "news", "trend"],
    label: "Hacker News 글 검색",
    name: "hackernews_search",
    run: searchHackerNews,
  },
  {
    description: "최신 뉴스 API로 주제 관련 기사를 찾습니다.",
    keywords: ["뉴스", "기사", "최신", "이슈", "정책", "경제", "사회", "야구", "축구", "농구", "스포츠", "경기", "선수", "팀", "리그", "kbo", "news"],
    label: "NewsAPI 뉴스 검색",
    name: "news_search",
    requiredEnv: ["NEWS_API_KEY"],
    run: searchNews,
  },
  {
    description: "NASA APOD에서 과학, 우주, 천문 이미지 자료를 찾습니다.",
    keywords: ["nasa", "우주", "천문", "과학", "사진", "이미지", "space", "astronomy", "apod"],
    label: "NASA 과학 자료 조회",
    name: "nasa_apod_search",
    requiredEnv: ["NASA_API_KEY"],
    run: searchNasaApod,
  },
  {
    description: "TMDB에서 영화, 드라마, 콘텐츠 정보를 찾습니다.",
    keywords: ["영화", "드라마", "시리즈", "배우", "감독", "movie", "tv", "tmdb", "콘텐츠", "추천"],
    label: "TMDB 콘텐츠 검색",
    name: "tmdb_search",
    requiredEnv: ["TMDB_API_KEY"],
    run: searchTmdb,
  },
  {
    description: "OpenAQ에서 공기질과 미세먼지 관련 데이터를 찾습니다.",
    keywords: ["공기", "공기질", "미세먼지", "초미세먼지", "대기", "환경", "air", "pm2.5", "pm10", "openaq"],
    label: "OpenAQ 공기질 조회",
    name: "openaq_lookup",
    requiredEnv: ["OPENAQ_API_KEY"],
    run: lookupOpenAq,
  },
  {
    description: "Frankfurter에서 환율 정보를 조회합니다.",
    keywords: ["환율", "달러", "유로", "엔화", "해외결제", "여행", "currency", "exchange", "usd", "eur", "jpy", "krw"],
    label: "Frankfurter 환율 조회",
    name: "frankfurter_rates",
    run: lookupFrankfurterRates,
  },
  {
    description: "CoinGecko에서 코인과 암호화폐 시장 정보를 찾습니다.",
    keywords: ["코인", "비트코인", "이더리움", "암호화폐", "crypto", "bitcoin", "ethereum", "coingecko", "market"],
    label: "CoinGecko 코인 검색",
    name: "coingecko_search",
    run: searchCoinGecko,
  },
  {
    description: "Alpha Vantage에서 주식, 기업, 경제 데이터를 찾습니다.",
    keywords: ["주식", "종목", "투자", "경제", "나스닥", "s&p", "stock", "ticker", "finance", "market", "alpha vantage"],
    label: "Alpha Vantage 주식 검색",
    name: "alpha_vantage_search",
    requiredEnv: ["ALPHA_VANTAGE_API_KEY"],
    run: searchAlphaVantage,
  },
  {
    description: "Naver Search API로 한국어 블로그, 뉴스, 책 검색 결과를 찾습니다.",
    keywords: ["한국어", "국내", "네이버", "블로그", "뉴스", "책", "검색", "야구", "축구", "농구", "스포츠", "경기", "선수", "팀", "리그", "kbo", "naver", "korea", "자료"],
    label: "Naver 검색",
    name: "naver_search",
    requiredEnv: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
    run: searchNaver,
  },
];

export function listResearchTools() {
  return researchTools;
}

export function getResearchTool(name: string) {
  return researchTools.find((tool) => tool.name === name);
}

export function isResearchToolName(name: string): name is ResearchToolName {
  return Boolean(getResearchTool(name));
}

export function getResearchToolLabel(name: ResearchToolName) {
  return getResearchTool(name)?.label ?? name;
}

export function isResearchToolAvailable(tool: ResearchToolSpec) {
  return !tool.requiredEnv || tool.requiredEnv.every((envName) => Boolean(process.env[envName]));
}

export function selectResearchTools(input: ResearchToolSelectionInput, maxTools = 3): ResearchToolSelection[] {
  const title = normalize(input.title);
  const content = normalize(input.content);
  const tags = input.tags.map(normalize);
  const fullText = normalize([input.title, input.content, ...input.tags].join(" "));
  const selections = researchTools
    .filter(isResearchToolAvailable)
    .map((tool) => {
      const matchedKeywords = findMatchedKeywords(tool, title, content, tags);
      const score = scoreTool(tool, title, content, tags, fullText, matchedKeywords);

      return {
        matchedKeywords,
        reason: buildReason(tool, matchedKeywords),
        score,
        tool: tool.name as ResearchToolName,
      };
    })
    .filter((selection) => selection.score > 0)
    .sort((left, right) => right.score - left.score);

  if (selections.length > 0) {
    return selections.slice(0, maxTools);
  }

  const fallbackSelections: ResearchToolSelection[] = [
    {
      matchedKeywords: ["기본"],
      reason: "일반 주제로 보고 개념 설명 자료를 먼저 찾습니다.",
      score: 1,
      tool: "wikipedia_search",
    },
    {
      matchedKeywords: ["기본"],
      reason: "관련해서 더 공부할 만한 책 자료를 함께 찾습니다.",
      score: 1,
      tool: "open_library_search",
    },
    {
      matchedKeywords: ["기본"],
      reason: "추가 책 정보를 확인할 수 있는 자료를 찾습니다.",
      score: 1,
      tool: "google_books_search",
    },
  ];

  return fallbackSelections.slice(0, maxTools);
}

function scoreTool(
  tool: ResearchToolSpec,
  title: string,
  content: string,
  tags: string[],
  fullText: string,
  matchedKeywords: string[],
) {
  let score = 0;

  for (const keyword of tool.keywords.map(normalize)) {
    if (!keyword) {
      continue;
    }

    if (title.includes(keyword)) {
      score += 5;
    }

    if (tags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) {
      score += 4;
    }

    if (content.includes(keyword)) {
      score += 2;
    }
  }

  const descriptionTokens = tokenize(tool.description);
  const textTokens = new Set(tokenize(fullText));
  const overlapCount = descriptionTokens.filter((token) => textTokens.has(token)).length;

  score += Math.min(overlapCount, 5) * 0.5;
  score += matchedKeywords.length * 0.2;

  return Number(score.toFixed(2));
}

function findMatchedKeywords(tool: ResearchToolSpec, title: string, content: string, tags: string[]) {
  const matchedKeywords = new Set<string>();

  for (const keyword of tool.keywords) {
    const normalizedKeyword = normalize(keyword);

    if (
      normalizedKeyword &&
      (title.includes(normalizedKeyword) ||
        content.includes(normalizedKeyword) ||
        tags.some((tag) => tag.includes(normalizedKeyword) || normalizedKeyword.includes(tag)))
    ) {
      matchedKeywords.add(keyword);
    }
  }

  return Array.from(matchedKeywords).slice(0, 5);
}

function buildReason(tool: ResearchToolSpec, matchedKeywords: string[]) {
  if (matchedKeywords.length === 0) {
    return `${tool.label}이 글의 주제와 가장 가깝다고 판단했습니다.`;
  }

  return `${matchedKeywords.join(", ")} 키워드 때문에 ${tool.label}을 선택했습니다.`;
}

async function searchWikipedia(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.WIKIPEDIA_API_URL ?? "https://ko.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", String(limit));

  const payload = await fetchJson(url);
  const search = readRecord(payload.query)?.search;
  const items = Array.isArray(search) ? search.filter(isRecord) : [];

  return makeToolResult(
    "wikipedia_search",
    query,
    items.map((item) => {
      const title = readString(item.title) ?? "Wikipedia 문서";

      return {
        metadata: ["개념 설명", "위키 문서"],
        source: "Wikipedia",
        summary: stripHtml(readString(item.snippet) ?? "개념을 빠르게 확인할 수 있는 위키 문서입니다."),
        title,
        url: `https://ko.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      };
    }),
  );
}

async function searchOpenLibrary(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.OPEN_LIBRARY_API_URL ?? "https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const payload = await fetchJson(url);
  const docs = Array.isArray(payload.docs) ? payload.docs.filter(isRecord) : [];

  return makeToolResult(
    "open_library_search",
    query,
    docs.map((book) => {
      const title = readString(book.title) ?? "Open Library book";
      const authors = readStringArray(book.author_name).slice(0, 3);
      const publishYear = readNumber(book.first_publish_year);

      return {
        metadata: [`저자 ${authors.join(", ") || "정보 없음"}`, publishYear ? `출간 ${publishYear}` : "출간연도 정보 없음"],
        source: "Open Library",
        summary: `${authors.join(", ") || "저자 미상"}의 관련 도서입니다.`,
        title,
        url: `https://openlibrary.org${readString(book.key) ?? ""}`,
      };
    }),
  );
}

async function searchGoogleBooks(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.GOOGLE_BOOKS_API_URL ?? "https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(Math.min(limit, 10)));

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const payload = await fetchJson(url);
  const items = Array.isArray(payload.items) ? payload.items.filter(isRecord) : [];

  return makeToolResult(
    "google_books_search",
    query,
    items.map((item) => {
      const volumeInfo = readRecord(item.volumeInfo) ?? {};
      const title = readString(volumeInfo.title) ?? "Google Books 도서";
      const authors = readStringArray(volumeInfo.authors).slice(0, 3);

      return {
        metadata: [`저자 ${authors.join(", ") || "정보 없음"}`, readString(volumeInfo.publishedDate) ? `출간 ${readString(volumeInfo.publishedDate)}` : "출간일 정보 없음"],
        source: "Google Books",
        summary: readString(volumeInfo.description) ?? "관련 도서 정보를 확인할 수 있습니다.",
        title,
        url: readString(volumeInfo.infoLink) ?? "https://books.google.com/",
      };
    }),
  );
}

async function searchCrossref(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.CROSSREF_API_URL ?? "https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", String(limit));

  const payload = await fetchJson(url);
  const items = readRecord(readRecord(payload.message)?.items) ? [] : readRecord(payload.message)?.items;
  const works = Array.isArray(items) ? items.filter(isRecord) : [];

  return makeToolResult(
    "crossref_search",
    query,
    works.map((work) => {
      const title = readStringArray(work.title)[0] ?? "Crossref 학술자료";

      return {
        metadata: [readString(work.type) ?? "학술자료", readString(work.DOI) ? `DOI ${readString(work.DOI)}` : "DOI 정보 없음"],
        source: "Crossref",
        summary: readStringArray(work.subtitle)[0] ?? "학술 메타데이터를 확인할 수 있습니다.",
        title,
        url: readString(work.URL) ?? "https://www.crossref.org/",
      };
    }),
  );
}

async function searchOpenAlex(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.OPENALEX_API_URL ?? "https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(limit));

  const payload = await fetchJson(url);
  const results = Array.isArray(payload.results) ? payload.results.filter(isRecord) : [];

  return makeToolResult(
    "openalex_search",
    query,
    results.map((work) => ({
      metadata: [
        readNumber(work.publication_year) ? `연도 ${readNumber(work.publication_year)}` : "연도 정보 없음",
        `인용 ${readNumber(work.cited_by_count)}`,
      ],
      source: "OpenAlex",
      summary: readString(work.type) ?? "연구 자료 메타데이터입니다.",
      title: readString(work.title) ?? "OpenAlex 연구 자료",
      url: readString(work.doi) ?? readString(work.id) ?? "https://openalex.org/",
    })),
  );
}

async function searchSemanticScholar(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.SEMANTIC_SCHOLAR_API_URL ?? "https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", "title,abstract,url,year,authors,citationCount");

  const headers: Record<string, string> = process.env.SEMANTIC_SCHOLAR_API_KEY
    ? { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY }
    : {};
  const payload = await fetchJson(url, headers);
  const data = Array.isArray(payload.data) ? payload.data.filter(isRecord) : [];

  return makeToolResult(
    "semantic_scholar_search",
    query,
    data.map((paper) => ({
      metadata: [
        readNumber(paper.year) ? `연도 ${readNumber(paper.year)}` : "연도 정보 없음",
        `인용 ${readNumber(paper.citationCount)}`,
      ],
      source: "Semantic Scholar",
      summary: readString(paper.abstract) ?? "논문 초록 정보가 없으니 제목과 링크를 확인해 보세요.",
      title: readString(paper.title) ?? "Semantic Scholar 논문",
      url: readString(paper.url) ?? "https://www.semanticscholar.org/",
    })),
  );
}

async function searchDevto(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.DEVTO_API_URL ?? "https://dev.to/api/articles");
  url.searchParams.set("per_page", String(limit));
  url.searchParams.set("tag", pickDevtoTag(query));

  const payload = await fetchJson(url);
  const articles = Array.isArray(payload) ? payload.filter(isRecord) : [];

  return makeToolResult(
    "devto_search",
    query,
    articles.map((article) => ({
      metadata: [`반응 ${readNumber(article.public_reactions_count)}`, `댓글 ${readNumber(article.comments_count)}`],
      source: "DEV.to",
      summary: readString(article.description) ?? "개발자가 작성한 관련 글입니다.",
      title: readString(article.title) ?? "DEV.to article",
      url: readString(article.url) ?? "https://dev.to",
    })),
  );
}

async function searchHackerNews(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.HACKERNEWS_API_URL ?? "https://hn.algolia.com/api/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", String(limit));

  const payload = await fetchJson(url);
  const hits = Array.isArray(payload.hits) ? payload.hits.filter(isRecord) : [];

  return makeToolResult(
    "hackernews_search",
    query,
    hits.map((hit) => ({
      metadata: [`points ${readNumber(hit.points)}`, `comments ${readNumber(hit.num_comments)}`],
      source: "Hacker News",
      summary: "기술 커뮤니티에서 논의된 관련 글입니다.",
      title: readString(hit.title) ?? "Hacker News story",
      url: readString(hit.url) ?? (readString(hit.objectID) ? `https://news.ycombinator.com/item?id=${readString(hit.objectID)}` : "https://news.ycombinator.com/"),
    })),
  );
}

async function searchNews(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.NEWS_API_URL ?? "https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("sortBy", "relevancy");
  url.searchParams.set("apiKey", readRequiredEnv("NEWS_API_KEY"));

  const payload = await fetchJson(url);
  const articles = Array.isArray(payload.articles) ? payload.articles.filter(isRecord) : [];

  return makeToolResult(
    "news_search",
    query,
    articles.map((article) => ({
      metadata: [readString(article.publishedAt)?.slice(0, 10) ?? "날짜 정보 없음"],
      source: readString(readRecord(article.source)?.name) ?? "NewsAPI",
      summary: readString(article.description) ?? "관련 뉴스 기사입니다.",
      title: readString(article.title) ?? "뉴스 기사",
      url: readString(article.url) ?? "",
    })),
  );
}

async function searchNasaApod(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.NASA_APOD_API_URL ?? "https://api.nasa.gov/planetary/apod");
  url.searchParams.set("api_key", readRequiredEnv("NASA_API_KEY"));
  url.searchParams.set("count", String(Math.min(limit, 5)));

  const payload = await fetchJson(url);
  const items = Array.isArray(payload) ? payload.filter(isRecord) : [payload].filter(isRecord);

  return makeToolResult(
    "nasa_apod_search",
    query,
    items.map((item) => ({
      metadata: [readString(item.date) ?? "날짜 정보 없음", readString(item.media_type) ?? "media"],
      source: "NASA APOD",
      summary: readString(item.explanation) ?? "NASA 천문 자료입니다.",
      title: readString(item.title) ?? "NASA APOD",
      url: readString(item.url) ?? "https://api.nasa.gov/",
    })),
  );
}

async function searchTmdb(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.TMDB_API_URL ?? "https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", readRequiredEnv("TMDB_API_KEY"));
  url.searchParams.set("query", query);
  url.searchParams.set("language", "ko-KR");
  url.searchParams.set("page", "1");

  const payload = await fetchJson(url);
  const results = Array.isArray(payload.results) ? payload.results.filter(isRecord).slice(0, limit) : [];

  return makeToolResult(
    "tmdb_search",
    query,
    results.map((item) => ({
      metadata: [readString(item.media_type) ?? "content", readNumber(item.vote_average) ? `평점 ${readNumber(item.vote_average)}` : "평점 정보 없음"],
      source: "TMDB",
      summary: readString(item.overview) ?? "영화/드라마 콘텐츠 정보입니다.",
      title: readString(item.title) ?? readString(item.name) ?? "TMDB 콘텐츠",
      url: readNumber(item.id) ? `https://www.themoviedb.org/${readString(item.media_type) ?? "movie"}/${readNumber(item.id)}` : "https://www.themoviedb.org/",
    })),
  );
}

async function lookupOpenAq(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.OPENAQ_API_URL ?? "https://api.openaq.org/v3/locations");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("countries_id", "KR");

  const payload = await fetchJson(url, { "X-API-Key": readRequiredEnv("OPENAQ_API_KEY") });
  const results = Array.isArray(payload.results) ? payload.results.filter(isRecord) : [];

  return makeToolResult(
    "openaq_lookup",
    query,
    results.map((location) => ({
      metadata: [readString(location.locality) ?? "지역 정보 없음", readString(location.country?.toString()) ?? "KR"],
      source: "OpenAQ",
      summary: "공기질 측정소와 대기질 데이터를 확인할 수 있는 위치 정보입니다.",
      title: readString(location.name) ?? "OpenAQ location",
      url: "https://openaq.org/",
    })),
  );
}

async function lookupFrankfurterRates(query: string): Promise<ResearchToolResult> {
  const url = new URL(process.env.FRANKFURTER_API_URL ?? "https://api.frankfurter.dev/v2/rates");
  url.searchParams.set("base", query.toLowerCase().includes("유로") || query.toLowerCase().includes("eur") ? "EUR" : "USD");
  url.searchParams.set("quotes", "KRW,EUR,JPY,USD");

  const payload = await fetchJson(url);
  const rates = readRecord(payload.rates) ?? {};
  const rateText = Object.entries(rates)
    .map(([currency, value]) => `${currency} ${value}`)
    .join(", ");

  return makeToolResult("frankfurter_rates", query, [
    {
      metadata: [readString(payload.date) ?? "날짜 정보 없음"],
      source: "Frankfurter",
      summary: `주요 환율: ${rateText || "환율 정보 없음"}`,
      title: `${readString(payload.base) ?? "USD"} 기준 환율`,
      url: "https://frankfurter.dev/",
    },
  ]);
}

async function searchCoinGecko(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3/search");
  url.searchParams.set("query", query);
  const headers: Record<string, string> = process.env.COINGECKO_API_KEY
    ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY }
    : {};
  const payload = await fetchJson(url, headers);
  const coins = Array.isArray(payload.coins) ? payload.coins.filter(isRecord).slice(0, limit) : [];

  return makeToolResult(
    "coingecko_search",
    query,
    coins.map((coin) => ({
      metadata: [readString(coin.symbol) ?? "symbol 없음", readNumber(coin.market_cap_rank) ? `시총순위 ${readNumber(coin.market_cap_rank)}` : "순위 정보 없음"],
      source: "CoinGecko",
      summary: "암호화폐 기본 정보와 시장 순위를 확인할 수 있습니다.",
      title: readString(coin.name) ?? "CoinGecko coin",
      url: readString(coin.id) ? `https://www.coingecko.com/en/coins/${readString(coin.id)}` : "https://www.coingecko.com/",
    })),
  );
}

async function searchAlphaVantage(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.ALPHA_VANTAGE_API_URL ?? "https://www.alphavantage.co/query");
  url.searchParams.set("function", "SYMBOL_SEARCH");
  url.searchParams.set("keywords", query);
  url.searchParams.set("apikey", readRequiredEnv("ALPHA_VANTAGE_API_KEY"));

  const payload = await fetchJson(url);
  const matches = Array.isArray(payload.bestMatches) ? payload.bestMatches.filter(isRecord).slice(0, limit) : [];

  return makeToolResult(
    "alpha_vantage_search",
    query,
    matches.map((match) => ({
      metadata: [readString(match["1. symbol"]) ?? "symbol 없음", readString(match["4. region"]) ?? "지역 정보 없음"],
      source: "Alpha Vantage",
      summary: `${readString(match["3. type"]) ?? "종목"} / ${readString(match["8. currency"]) ?? "통화 정보 없음"}`,
      title: readString(match["2. name"]) ?? "Alpha Vantage symbol",
      url: "https://www.alphavantage.co/",
    })),
  );
}

async function searchNaver(query: string, limit: number): Promise<ResearchToolResult> {
  const url = new URL(process.env.NAVER_SEARCH_API_URL ?? "https://openapi.naver.com/v1/search/blog.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(limit));

  const payload = await fetchJson(url, {
    "X-Naver-Client-Id": readRequiredEnv("NAVER_CLIENT_ID"),
    "X-Naver-Client-Secret": readRequiredEnv("NAVER_CLIENT_SECRET"),
  });
  const items = Array.isArray(payload.items) ? payload.items.filter(isRecord) : [];

  return makeToolResult(
    "naver_search",
    query,
    items.map((item) => ({
      metadata: [readString(item.bloggername) ?? "블로그 정보 없음", readString(item.postdate) ?? "날짜 정보 없음"],
      source: "Naver",
      summary: stripHtml(readString(item.description) ?? "한국어 검색 결과입니다."),
      title: stripHtml(readString(item.title) ?? "Naver 검색 결과"),
      url: readString(item.link) ?? "https://search.naver.com/",
    })),
  );
}

function makeToolResult(tool: ResearchToolName, query: string, items: ResearchResult[]): ResearchToolResult {
  return {
    items,
    query,
    tool,
  };
}

async function fetchJson(url: URL, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "nest-ai-board/0.1",
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`외부 API 요청에 실패했습니다. (${response.status})`);
    }

    return (await response.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} 환경변수가 설정되어 있지 않습니다.`);
  }

  return value;
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalize(value)
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function pickDevtoTag(query: string) {
  const text = normalize(query);
  const candidates = ["react", "javascript", "typescript", "node", "nextjs", "nestjs", "webdev", "ai", "database"];

  return candidates.find((candidate) => text.includes(candidate)) ?? "webdev";
}

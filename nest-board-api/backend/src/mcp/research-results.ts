export type ResearchToolName =
  | "stackoverflow_search"
  | "github_repo_search"
  | "arxiv_paper_search"
  | "weather_lookup"
  | "wikipedia_search"
  | "open_library_search"
  | "google_books_search"
  | "crossref_search"
  | "openalex_search"
  | "semantic_scholar_search"
  | "devto_search"
  | "hackernews_search"
  | "news_search"
  | "nasa_apod_search"
  | "tmdb_search"
  | "openaq_lookup"
  | "frankfurter_rates"
  | "coingecko_search"
  | "alpha_vantage_search"
  | "naver_search";

export type ResearchResult = {
  metadata: string[];
  source: string;
  summary: string;
  title: string;
  url: string;
};

export type ResearchToolResult = {
  items: ResearchResult[];
  query: string;
  tool: ResearchToolName;
};

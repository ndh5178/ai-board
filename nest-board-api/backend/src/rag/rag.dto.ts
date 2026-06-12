export type SearchJobPostingsQuery = {
  limit?: unknown;
  q?: unknown;
};

export function readSearchJobPostingsQuery(query: SearchJobPostingsQuery = {}) {
  const q = typeof query.q === "string" ? query.q.trim() : "";

  if (!q) {
    throw new Error("검색할 q 값이 필요합니다.");
  }

  return {
    limit: readLimit(query.limit),
    q,
  };
}

function readLimit(value: unknown) {
  const limit = Number(value ?? 5);

  if (!Number.isFinite(limit) || limit <= 0) {
    return 5;
  }

  return Math.min(Math.floor(limit), 10);
}

export type CreatePostBody = {
  content?: unknown;
  tags?: unknown;
  title?: unknown;
};

export type UpdatePostBody = {
  content?: unknown;
  tags?: unknown;
  title?: unknown;
};

export type ListPostsQuery = {
  page?: unknown;
  pageSize?: unknown;
  q?: unknown;
  tag?: unknown;
};

export function readPostTitle(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("title 값이 필요합니다.");
  }

  const title = value.trim();

  if (title.length > 200) {
    throw new Error("title은 200자 이하로 입력해주세요.");
  }

  return title;
}

export function readPostContent(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("content 값이 필요합니다.");
  }

  return value.trim();
}

export function readOptionalPostTitle(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return readPostTitle(value);
}

export function readOptionalPostContent(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return readPostContent(value);
}

export function readOptionalTagNames(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return normalizeTagNames(value.split(","));
  }

  if (Array.isArray(value)) {
    return normalizeTagNames(value);
  }

  throw new Error("tags는 문자열 배열 또는 쉼표로 구분된 문자열이어야 합니다.");
}

export function readPostsQuery(query: ListPostsQuery) {
  const page = readPositiveNumber(query.page, 1);
  const pageSize = Math.min(readPositiveNumber(query.pageSize, 10), 50);
  const q = readOptionalQueryString(query.q);
  const tag = readOptionalQueryString(query.tag);

  return {
    page,
    pageSize,
    q,
    skip: (page - 1) * pageSize,
    tag,
  };
}

function normalizeTagNames(values: unknown[]) {
  const tagNames = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tagNames)];
}

function readOptionalQueryString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readPositiveNumber(value: unknown, defaultValue: number) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return defaultValue;
  }

  return parsedValue;
}

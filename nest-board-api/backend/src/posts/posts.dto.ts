export type CreatePostBody = {
  content?: unknown;
  title?: unknown;
};

export type UpdatePostBody = {
  content?: unknown;
  title?: unknown;
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

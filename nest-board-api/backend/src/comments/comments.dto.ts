export type CreateCommentBody = {
  content?: unknown;
};

export type UpdateCommentBody = {
  content?: unknown;
};

export function readCommentContent(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("content 값이 필요합니다.");
  }

  return value.trim();
}

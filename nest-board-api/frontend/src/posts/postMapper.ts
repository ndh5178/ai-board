import type { ApiComment, ApiPost, PostComment, PostSummary } from "../types/post";

const accents = ["#ef3f7b", "#7c3cff", "#1f9d8a", "#ff8a3d", "#2563eb"];

export type ListPostsResponse = {
  page: number;
  pageSize: number;
  posts: ApiPost[];
  totalCount: number;
  totalPages: number;
};

export function formatDate(value: string) {
  return value.slice(0, 10);
}

export function createExcerpt(content: string) {
  const text = content.replace(/\s+/g, " ").trim();

  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

export function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toPostComment(comment: ApiComment): PostComment {
  return {
    authorEmail: comment.author.email,
    authorName: comment.author.name,
    content: comment.content,
    createdAt: formatDate(comment.createdAt),
    id: comment.id,
  };
}

export function toPostSummary(post: ApiPost, index = 0): PostSummary {
  const content = post.content ?? post.excerpt ?? "";

  return {
    accent: accents[index % accents.length],
    authorEmail: post.author.email,
    authorName: post.author.name,
    commentCount: post._count.comments,
    comments: post.comments?.map(toPostComment) ?? [],
    content,
    createdAt: formatDate(post.createdAt),
    excerpt: post.excerpt ?? createExcerpt(content),
    id: post.id,
    tags: post.tags.map((tagLink) => tagLink.tag.name),
    title: post.title,
  };
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest } from "../api/client";
import type { ApiResult } from "../types/api";
import type { ApiComment, ApiPost, PostComment, PostSummary } from "../types/post";

const accents = ["#ef3f7b", "#7c3cff", "#1f9d8a", "#ff8a3d", "#2563eb"];

type PostInput = {
  authorEmail?: string;
  authorName?: string;
  content: string;
  tags: string;
  title: string;
};

type PostsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  tag?: string;
};

type PostsContextValue = {
  addComment: (postId: string, input: CommentInput) => Promise<ApiResult<PostComment>>;
  createPost: (input: PostInput) => Promise<ApiResult<PostSummary>>;
  deletePost: (id: string) => Promise<ApiResult<{ id: string; ok: true }>>;
  deletePostsByAuthor: (authorEmail: string) => void;
  fetchPostById: (id: string | undefined) => Promise<ApiResult<PostSummary>>;
  generateResearchComment: (postId: string) => Promise<ApiResult<PostComment>>;
  getPostById: (id: string | undefined) => PostSummary | undefined;
  isLoading: boolean;
  loadPosts: (query?: PostsQuery) => Promise<ApiResult<ListPostsResponse>>;
  page: number;
  pageSize: number;
  posts: PostSummary[];
  popularTags: string[];
  removeComment: (postId: string, commentId: string) => Promise<ApiResult<{ id: string; ok: true }>>;
  totalCount: number;
  totalPages: number;
  updateComment: (postId: string, commentId: string, content: string) => Promise<ApiResult<PostComment>>;
  updatePost: (id: string, input: Pick<PostInput, "content" | "tags" | "title">) => Promise<ApiResult<PostSummary>>;
};

type CommentInput = {
  authorEmail?: string;
  authorName?: string;
  content: string;
};

type ListPostsResponse = {
  page: number;
  pageSize: number;
  posts: ApiPost[];
  totalCount: number;
  totalPages: number;
};

type PostResponse = {
  post: ApiPost;
};

type CommentResponse = {
  comment: ApiComment;
};

type ResearchCommentResponse = CommentResponse & {
  created: boolean;
  message?: string;
};

type TagsResponse = {
  tags: Array<{
    _count: {
      posts: number;
    };
    id: string;
    name: string;
  }>;
};

const PostsContext = createContext<PostsContextValue | null>(null);

function formatDate(value: string) {
  return value.slice(0, 10);
}

function createExcerpt(content: string) {
  const text = content.replace(/\s+/g, " ").trim();

  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toPostComment(comment: ApiComment): PostComment {
  return {
    authorEmail: comment.author.email,
    authorName: comment.author.name,
    content: comment.content,
    createdAt: formatDate(comment.createdAt),
    id: comment.id,
  };
}

function toPostSummary(post: ApiPost, index = 0): PostSummary {
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

function buildPostsPath(query: PostsQuery = {}) {
  const searchParams = new URLSearchParams();

  if (query.q) {
    searchParams.set("q", query.q);
  }

  if (query.tag) {
    searchParams.set("tag", query.tag);
  }

  if (query.page) {
    searchParams.set("page", String(query.page));
  }

  if (query.pageSize) {
    searchParams.set("pageSize", String(query.pageSize));
  }

  const queryString = searchParams.toString();

  return queryString ? `/posts?${queryString}` : "/posts";
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData() {
    setIsLoading(true);
    await Promise.all([loadPosts(), loadTags()]);
    setIsLoading(false);
  }

  async function loadTags() {
    const result = await apiRequest<TagsResponse>("/tags");

    if (result.ok) {
      setPopularTags(result.data.tags.map((tag) => tag.name));
    }
  }

  async function loadPosts(query: PostsQuery = {}) {
    const result = await apiRequest<ListPostsResponse>(buildPostsPath(query));

    if (result.ok) {
      setPosts(result.data.posts.map(toPostSummary));
      setPage(result.data.page);
      setPageSize(result.data.pageSize);
      setTotalCount(result.data.totalCount);
      setTotalPages(Math.max(result.data.totalPages, 1));
    }

    return result;
  }

  const value = useMemo<PostsContextValue>(() => {
    return {
      addComment: async (postId, { content }) => {
        const result = await apiRequest<CommentResponse>(`/posts/${postId}/comments`, {
          auth: true,
          body: {
            content,
          },
          method: "POST",
        });

        if (result.ok) {
          const comment = toPostComment(result.data.comment);
          setPosts((currentPosts) =>
            currentPosts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    commentCount: post.commentCount + 1,
                    comments: [...post.comments, comment],
                  }
                : post,
            ),
          );

          return {
            data: comment,
            ok: true,
          };
        }

        return result;
      },
      createPost: async ({ content, tags, title }) => {
        const result = await apiRequest<PostResponse>("/posts", {
          auth: true,
          body: {
            content,
            tags: parseTags(tags),
            title,
          },
          method: "POST",
        });

        if (result.ok) {
          const post = toPostSummary(result.data.post);
          setPosts((currentPosts) => [post, ...currentPosts]);
          void loadTags();

          return {
            data: post,
            ok: true,
          };
        }

        return result;
      },
      deletePost: async (id) => {
        const result = await apiRequest<{ id: string; ok: true }>(`/posts/${id}`, {
          auth: true,
          method: "DELETE",
        });

        if (result.ok) {
          setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
          void loadTags();
        }

        return result;
      },
      deletePostsByAuthor: (authorEmail) => {
        setPosts((currentPosts) =>
          currentPosts
            .filter((post) => post.authorEmail !== authorEmail)
            .map((post) => {
              const comments = post.comments.filter((comment) => comment.authorEmail !== authorEmail);

              return {
                ...post,
                commentCount: comments.length,
                comments,
              };
            }),
        );
      },
      fetchPostById: async (id) => {
        if (!id) {
          return {
            message: "게시글 id가 필요합니다.",
            ok: false,
          };
        }

        const result = await apiRequest<PostResponse>(`/posts/${id}`);

        if (result.ok) {
          const post = toPostSummary(result.data.post);
          setPosts((currentPosts) => {
            const exists = currentPosts.some((currentPost) => currentPost.id === id);

            return exists
              ? currentPosts.map((currentPost) => (currentPost.id === id ? post : currentPost))
              : [post, ...currentPosts];
          });

          return {
            data: post,
            ok: true,
          };
        }

        return result;
      },
      generateResearchComment: async (postId) => {
        const result = await apiRequest<ResearchCommentResponse>(`/ai/posts/${postId}/research-comment`, {
          auth: true,
          method: "POST",
        });

        if (result.ok) {
          const comment = toPostComment(result.data.comment);

          setPosts((currentPosts) =>
            currentPosts.map((post) => {
              if (post.id !== postId) {
                return post;
              }

              const exists = post.comments.some((currentComment) => currentComment.id === comment.id);

              return {
                ...post,
                commentCount: exists || !result.data.created ? post.commentCount : post.commentCount + 1,
                comments: exists ? post.comments : [...post.comments, comment],
              };
            }),
          );

          return {
            data: comment,
            ok: true,
          };
        }

        return result;
      },
      getPostById: (id) => {
        return posts.find((post) => post.id === id);
      },
      isLoading,
      loadPosts,
      page,
      pageSize,
      popularTags,
      posts,
      removeComment: async (postId, commentId) => {
        const result = await apiRequest<{ id: string; ok: true }>(`/comments/${commentId}`, {
          auth: true,
          method: "DELETE",
        });

        if (result.ok) {
          setPosts((currentPosts) =>
            currentPosts.map((post) => {
              if (post.id !== postId) {
                return post;
              }

              const comments = post.comments.filter((comment) => comment.id !== commentId);

              return {
                ...post,
                commentCount: comments.length,
                comments,
              };
            }),
          );
        }

        return result;
      },
      totalCount,
      totalPages,
      updateComment: async (postId, commentId, content) => {
        const result = await apiRequest<CommentResponse>(`/comments/${commentId}`, {
          auth: true,
          body: {
            content,
          },
          method: "PATCH",
        });

        if (result.ok) {
          const comment = toPostComment(result.data.comment);
          setPosts((currentPosts) =>
            currentPosts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    comments: post.comments.map((currentComment) =>
                      currentComment.id === commentId ? comment : currentComment,
                    ),
                  }
                : post,
            ),
          );

          return {
            data: comment,
            ok: true,
          };
        }

        return result;
      },
      updatePost: async (id, { content, tags, title }) => {
        const result = await apiRequest<PostResponse>(`/posts/${id}`, {
          auth: true,
          body: {
            content,
            tags: parseTags(tags),
            title,
          },
          method: "PATCH",
        });

        if (result.ok) {
          const post = toPostSummary(result.data.post);
          setPosts((currentPosts) =>
            currentPosts.map((currentPost) => (currentPost.id === id ? post : currentPost)),
          );
          void loadTags();

          return {
            data: post,
            ok: true,
          };
        }

        return result;
      },
    };
  }, [isLoading, page, pageSize, popularTags, posts, totalCount, totalPages]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);

  if (!context) {
    throw new Error("usePosts는 PostsProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { mockPosts } from "../data/mockPosts";
import type { PostSummary } from "../types/post";

const POSTS_STORAGE_KEY = "nest-board-posts";
const accents = ["#ef3f7b", "#7c3cff", "#1f9d8a", "#ff8a3d", "#2563eb"];

type PostInput = {
  authorEmail: string;
  authorName: string;
  content: string;
  tags: string;
  title: string;
};

type PostsContextValue = {
  addComment: (postId: string, input: CommentInput) => void;
  createPost: (input: PostInput) => string;
  deletePost: (id: string) => void;
  deletePostsByAuthor: (authorEmail: string) => void;
  getPostById: (id: string | undefined) => PostSummary | undefined;
  posts: PostSummary[];
  popularTags: string[];
  removeComment: (postId: string, commentId: string) => void;
  updateComment: (postId: string, commentId: string, content: string) => void;
  updatePost: (id: string, input: Pick<PostInput, "content" | "tags" | "title">) => void;
};

type CommentInput = {
  authorEmail: string;
  authorName: string;
  content: string;
};

const PostsContext = createContext<PostsContextValue | null>(null);

function createExcerpt(content: string) {
  const text = content.replace(/\s+/g, " ").trim();

  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

function createPostId() {
  return window.crypto?.randomUUID?.() ?? String(Date.now());
}

function createEntityId(prefix: string) {
  return `${prefix}-${createPostId()}`;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<PostSummary[]>(mockPosts);

  useEffect(() => {
    const rawPosts = window.localStorage.getItem(POSTS_STORAGE_KEY);

    if (!rawPosts) {
      return;
    }

    try {
      setPosts(JSON.parse(rawPosts) as PostSummary[]);
    } catch {
      window.localStorage.removeItem(POSTS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const value = useMemo<PostsContextValue>(() => {
    return {
      addComment: (postId, { authorEmail, authorName, content }) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post.id !== postId) {
              return post;
            }

            const comments = [
              ...post.comments,
              {
                authorEmail,
                authorName,
                content,
                createdAt: new Date().toISOString().slice(0, 10),
                id: createEntityId("comment"),
              },
            ];

            return {
              ...post,
              commentCount: comments.length,
              comments,
            };
          }),
        );
      },
      createPost: ({ authorEmail, authorName, content, tags, title }) => {
        const post: PostSummary = {
          accent: accents[posts.length % accents.length],
          authorEmail,
          authorName,
          commentCount: 0,
          comments: [],
          content,
          createdAt: new Date().toISOString().slice(0, 10),
          excerpt: createExcerpt(content),
          id: createPostId(),
          tags: parseTags(tags),
          title,
        };

        setPosts((currentPosts) => [post, ...currentPosts]);

        return post.id;
      },
      deletePost: (id) => {
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
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
      getPostById: (id) => {
        return posts.find((post) => post.id === id);
      },
      popularTags: Array.from(new Set(posts.flatMap((post) => post.tags))),
      posts,
      removeComment: (postId, commentId) => {
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
      },
      updateComment: (postId, commentId, content) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          content,
                        }
                      : comment,
                  ),
                }
              : post,
          ),
        );
      },
      updatePost: (id, { content, tags, title }) => {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  content,
                  excerpt: createExcerpt(content),
                  tags: parseTags(tags),
                  title,
                }
              : post,
          ),
        );
      },
    };
  }, [posts]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);

  if (!context) {
    throw new Error("usePosts는 PostsProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}

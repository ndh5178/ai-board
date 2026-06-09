"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { SimilarPost } from "@/types/rag";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  title?: string;
  content?: string;
  tags?: string;
};

export function PostForm({
  mode,
  postId,
  title = "",
  content = "",
  tags = "",
}: PostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarPosts, setSimilarPosts] = useState<SimilarPost[]>([]);
  const [isFindingSimilarPosts, setIsFindingSimilarPosts] = useState(false);

  function getPayload(form: HTMLFormElement) {
    const formData = new FormData(form);

    return {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      tags: String(formData.get("tags") ?? ""),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const payload = getPayload(event.currentTarget);
    const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "게시글을 저장하지 못했습니다.");
        return;
      }

      router.push(`/posts/${result?.id ?? postId}`);
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFindSimilarPosts() {
    if (!formRef.current) {
      return;
    }

    setMessage("");
    setIsFindingSimilarPosts(true);

    const payload = getPayload(formRef.current);

    try {
      const response = await fetch("/api/rag/similar-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          excludePostId: postId,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        posts?: SimilarPost[];
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "유사 게시글을 찾지 못했습니다.");
        return;
      }

      setSimilarPosts(result?.posts ?? []);
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsFindingSimilarPosts(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit} ref={formRef}>
      <label>
        제목
        <input
          name="title"
          placeholder="제목을 입력하세요"
          defaultValue={title}
          required
        />
      </label>
      <label>
        본문
        <textarea
          name="content"
          placeholder="내용을 입력하세요"
          defaultValue={content}
          required
          rows={10}
        />
      </label>
      <label>
        태그
        <input name="tags" placeholder="예: RAG, MCP, Agent" defaultValue={tags} />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <section className="rag-preview" aria-label="RAG 유사 게시글 추천">
        <div className="rag-preview__header">
          <div>
            <strong>유사 게시글 추천</strong>
            <p>현재 작성 중인 제목과 본문을 기준으로 비슷한 게시글을 찾습니다.</p>
          </div>
          <button
            className="button button--secondary"
            disabled={isFindingSimilarPosts}
            onClick={handleFindSimilarPosts}
            type="button"
          >
            {isFindingSimilarPosts ? "검색 중" : "비슷한 글 찾기"}
          </button>
        </div>
        {similarPosts.length > 0 ? (
          <ul className="rag-preview__list">
            {similarPosts.map((post) => (
              <li key={post.id}>
                <a href={`/posts/${post.id}`}>{post.title}</a>
                <span>{Math.round(post.similarity * 100)}% 유사</span>
                <p>{post.excerpt || `${post.authorName}님의 게시글`}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rag-preview__empty">
            제목이나 본문을 입력하고 버튼을 누르면 추천 결과가 여기에 표시됩니다.
          </p>
        )}
      </section>
      <div className="form-panel__actions">
        <button className="button button--primary" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중"
            : mode === "create"
              ? "게시글 등록"
              : "수정 완료"}
        </button>
      </div>
    </form>
  );
}

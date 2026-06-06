"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      tags: String(formData.get("tags") ?? ""),
    };
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

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
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

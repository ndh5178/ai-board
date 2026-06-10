"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CommentFormProps = {
  postId: string;
  isLoggedIn: boolean;
};

export function CommentForm({ postId, isLoggedIn }: CommentFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/posts/${postId}`)}`);
      return;
    }

    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "");

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "댓글을 등록하지 못했습니다.");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label>
        댓글
        <textarea
          name="content"
          placeholder={
            isLoggedIn ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"
          }
          rows={4}
        />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="button button--secondary" disabled={isSubmitting}>
        {isSubmitting ? "등록 중" : isLoggedIn ? "댓글 등록" : "로그인하고 댓글 쓰기"}
      </button>
    </form>
  );
}

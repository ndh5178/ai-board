"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CommentActionsProps = {
  commentId: string;
  initialContent: string;
};

export function CommentActions({
  commentId,
  initialContent,
}: CommentActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateComment() {
    const content = window.prompt("댓글을 수정하세요.", initialContent);

    if (content === null) {
      return;
    }

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "댓글을 수정하지 못했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteComment() {
    const confirmed = window.confirm("댓글을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "댓글을 삭제하지 못했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="comment__actions">
      <button disabled={isSaving} onClick={updateComment} type="button">
        수정
      </button>
      <button disabled={isSaving} onClick={deleteComment} type="button">
        삭제
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}

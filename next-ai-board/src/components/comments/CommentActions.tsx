"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type CommentActionsProps = {
  commentId: string;
  initialContent: string;
};

export function CommentActions({
  commentId,
  initialContent,
}: CommentActionsProps) {
  const router = useRouter();
  const [draftContent, setDraftContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function startEdit() {
    setDraftContent(initialContent);
    setMessage("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftContent(initialContent);
    setMessage("");
    setIsEditing(false);
  }

  async function updateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: draftContent }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "댓글을 수정하지 못했습니다.");
        return;
      }

      setIsEditing(false);
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

  if (isEditing) {
    return (
      <form className="comment__edit-form" onSubmit={updateComment}>
        <label>
          댓글 수정
          <textarea
            name="content"
            onChange={(event) => setDraftContent(event.target.value)}
            rows={4}
            value={draftContent}
          />
        </label>
        {message ? <p className="form-message">{message}</p> : null}
        <div className="comment__edit-actions">
          <button
            className="button button--secondary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "수정 중" : "수정 완료"}
          </button>
          <button
            className="button button--secondary"
            disabled={isSaving}
            onClick={cancelEdit}
            type="button"
          >
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <p className="comment__body">{initialContent}</p>
      <div className="comment__actions">
        <button disabled={isSaving} onClick={startEdit} type="button">
          수정
        </button>
        <button disabled={isSaving} onClick={deleteComment} type="button">
          삭제
        </button>
        {message ? <p className="form-message">{message}</p> : null}
      </div>
    </>
  );
}

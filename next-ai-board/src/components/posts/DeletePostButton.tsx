"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeletePostButtonProps = {
  postId: string;
};

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm("게시글을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "게시글을 삭제하지 못했습니다.");
        return;
      }

      router.push("/posts");
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="delete-action">
      <button
        className="button button--danger"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? "삭제 중" : "삭제"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}

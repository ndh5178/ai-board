"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      password: String(formData.get("password") ?? ""),
      confirmText: String(formData.get("confirmText") ?? ""),
    };

    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "회원 탈퇴를 처리하지 못했습니다.");
        return;
      }

      router.push("/signup");
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <p className="settings-warning">
        탈퇴하면 내 계정, 게시글, 댓글이 함께 삭제됩니다.
      </p>
      <label>
        확인 문구
        <input
          name="confirmText"
          placeholder="회원 탈퇴"
          required
          type="text"
        />
      </label>
      <label>
        비밀번호
        <input name="password" required type="password" />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="button button--danger" disabled={isSubmitting}>
        {isSubmitting ? "탈퇴 처리 중" : "회원 탈퇴"}
      </button>
    </form>
  );
}

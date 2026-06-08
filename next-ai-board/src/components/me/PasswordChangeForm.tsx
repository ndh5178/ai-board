"use client";

import { useState } from "react";

export function PasswordChangeForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      const response = await fetch("/api/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      setMessage(result?.message ?? "비밀번호 변경 요청을 처리했습니다.");

      if (response.ok) {
        form.reset();
      }
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label>
        현재 비밀번호
        <input name="currentPassword" required type="password" />
      </label>
      <label>
        새 비밀번호
        <input minLength={8} name="newPassword" required type="password" />
      </label>
      <label>
        새 비밀번호 확인
        <input minLength={8} name="confirmPassword" required type="password" />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="button button--primary" disabled={isSubmitting}>
        {isSubmitting ? "변경 중" : "비밀번호 변경"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormClientProps = {
  mode: "login" | "signup";
};

export function AuthFormClient({ mode }: AuthFormClientProps) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "요청을 처리하지 못했습니다.");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={`/api/auth/${mode}`}
      className="auth-form"
      method="post"
      onSubmit={handleSubmit}
    >
      {isLogin ? null : (
        <label>
          이름
          <input name="name" placeholder="이름" required />
        </label>
      )}
      <label>
        이메일
        <input name="email" placeholder="you@example.com" required type="email" />
      </label>
      <label>
        비밀번호
        <input
          minLength={8}
          name="password"
          placeholder={isLogin ? "비밀번호" : "8자 이상 비밀번호"}
          required
          type="password"
        />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <button className="button button--primary" disabled={isSubmitting}>
        {isSubmitting ? "처리 중" : isLogin ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}

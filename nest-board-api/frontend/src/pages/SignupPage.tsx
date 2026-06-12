import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageShell } from "../components/PageShell";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      setMessage("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await signup({ email, name, password });
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate("/login", {
      replace: true,
      state: {
        message: "회원가입이 완료되었습니다. 로그인해 주세요.",
      },
    });
  };

  return (
    <PageShell description="NestJS 인증 API로 계정을 만든 뒤 로그인 페이지로 이동합니다." eyebrow="Auth" title="회원가입">
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            이름
            <input name="name" placeholder="이름" />
          </label>
          <label>
            이메일
            <input name="email" placeholder="you@example.com" type="email" />
          </label>
          <label>
            비밀번호
            <input name="password" placeholder="비밀번호" type="password" />
          </label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? "가입 중" : "회원가입"}
          </button>
        </form>
        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </PageShell>
  );
}

import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageShell } from "../components/PageShell";

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    typeof location.state?.message === "string" ? location.state.message : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = typeof location.state?.from === "string" ? location.state.from : "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <PageShell description="NestJS 인증 API로 로그인하고 accessToken을 저장합니다." eyebrow="Auth" title="로그인">
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
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
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>
        <p>
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </section>
    </PageShell>
  );
}

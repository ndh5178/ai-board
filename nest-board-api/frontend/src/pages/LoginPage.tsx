import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageShell } from "../components/PageShell";

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const from = typeof location.state?.from === "string" ? location.state.from : "/";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    login({ email, password });
    navigate(from, { replace: true });
  };

  return (
    <PageShell description="NestJS 인증 API와 연결하기 전 로그인 화면 구조를 먼저 잡습니다." eyebrow="Auth" title="로그인">
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
          <button className="button button--primary">
            로그인
          </button>
        </form>
        <p>
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </section>
    </PageShell>
  );
}

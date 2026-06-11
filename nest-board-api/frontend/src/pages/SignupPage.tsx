import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageShell } from "../components/PageShell";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      setMessage("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }

    signup({ email, name, password });
    navigate("/me", { replace: true });
  };

  return (
    <PageShell description="회원가입 API 연결 전 입력 폼과 화면 흐름을 준비합니다." eyebrow="Auth" title="회원가입">
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
          <button className="button button--primary">
            회원가입
          </button>
        </form>
        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </PageShell>
  );
}

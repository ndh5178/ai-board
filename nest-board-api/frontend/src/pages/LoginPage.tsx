import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
const SAVED_LOGIN_EMAIL_KEY = "career-board:saved-login-email";

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    typeof location.state?.message === "string" ? location.state.message : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savedEmail = localStorage.getItem(SAVED_LOGIN_EMAIL_KEY) ?? "";
  const [emailValue, setEmailValue] = useState(savedEmail);
  const [isRememberEmail, setIsRememberEmail] = useState(Boolean(savedEmail));
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

    if (isRememberEmail) {
      localStorage.setItem(SAVED_LOGIN_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(SAVED_LOGIN_EMAIL_KEY);
    }

    navigate(from, { replace: true });
  };

  return (
    <main className="auth-page auth-page--login">
      <section className="auth-card" aria-labelledby="h-login">
        <Link className="auth-card__brand" to="/">
          커리어보드
        </Link>
        <h1 id="h-login">로그인</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            아이디
            <input name="email" onChange={(event) => setEmailValue(event.target.value)} placeholder="이메일" type="email" value={emailValue}/>
          </label>
          <label>
            비밀번호
            <input name="password" placeholder="비밀번호" type="password" />
          </label>
          <div className="auth-form__options">
            <label className="auth-option">
              <input checked={isRememberEmail} onChange={(event) => setIsRememberEmail(event.target.checked)} type="checkbox"/>
              <span>아이디 저장</span>
            </label>
          </div>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="button button--primary auth-card__submit" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>
        <div className="auth-card__links">
          <span>아이디 찾기</span>
          <span>비밀번호 찾기</span>
          <Link to="/signup">회원가입</Link>
        </div>
      </section>
    </main>
  );
}

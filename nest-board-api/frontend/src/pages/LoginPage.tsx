import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
    <main className="auth-page auth-page--login">
      <section className="auth-card" aria-labelledby="h-login">
        <Link className="auth-card__brand" to="/">
          커리어보드
        </Link>
        <div className="auth-tabs" aria-label="회원 유형">
          <span className="auth-tabs__item auth-tabs__item--active">개인회원</span>
          <span className="auth-tabs__item">기업회원</span>
        </div>
        <p className="eyebrow">개인회원 로그인</p>
        <h1 id="h-login">로그인</h1>
        <div className="auth-social" aria-label="소셜 계정 로그인">
          <span className="auth-social__label">소셜 계정으로 간편 로그인</span>
          <div className="auth-social__items">
            <span className="auth-social__item auth-social__item--naver">N</span>
            <span className="auth-social__item auth-social__item--kakao">K</span>
            <span className="auth-social__item auth-social__item--google">G</span>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            이메일
            <input name="email" placeholder="이메일" type="email" />
          </label>
          <label>
            비밀번호
            <input name="password" placeholder="비밀번호" type="password" />
          </label>
          <div className="auth-form__options">
            <label className="auth-option">
              <input type="checkbox" />
              <span>로그인 유지</span>
            </label>
            <label className="auth-option">
              <input type="checkbox" />
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
        <p className="auth-card__notice">
          글쓰기와 댓글 작성은 로그인 후 이용할 수 있습니다.
        </p>
      </section>
    </main>
  );
}

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const signupBenefits = [
  "하나의 아이디로 게시글, 댓글, AI 분석을 모두 이용",
  "나의 글쓰기 습관과 관심 키워드 확인",
  "관심 태그 기반 게시글 추천",
  "프로필과 활동 내역을 한 곳에서 관리",
];

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
    <main className="auth-page auth-page--signup">
      <section className="auth-card auth-card--signup" aria-labelledby="h-signup">
        <div className="auth-card__main">
          <Link className="auth-card__brand" to="/">
            커리어보드
          </Link>
          <div className="auth-tabs" aria-label="회원 유형">
            <span className="auth-tabs__item auth-tabs__item--active">개인회원</span>
            <span className="auth-tabs__item">기업회원</span>
          </div>
          <p className="eyebrow">개인회원 가입</p>
          <h1 id="h-signup">사람인 통합 아이디 만들기</h1>
          <div className="auth-social" aria-label="소셜 계정 가입">
            <span className="auth-social__label">소셜 계정으로 간편 가입</span>
            <div className="auth-social__items">
              <span className="auth-social__item auth-social__item--naver">N</span>
              <span className="auth-social__item auth-social__item--kakao">K</span>
              <span className="auth-social__item auth-social__item--google">G</span>
            </div>
          </div>
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
              <input name="password" placeholder="8자 이상 비밀번호" type="password" />
            </label>
            <label className="auth-option">
              <input type="checkbox" />
              <span>개인정보 처리방침과 이용약관을 확인했습니다</span>
            </label>
            {message ? <p className="form-message">{message}</p> : null}
            <button className="button button--primary auth-card__submit" disabled={isSubmitting}>
              {isSubmitting ? "가입 중" : "회원가입"}
            </button>
          </form>
          <div className="auth-card__links">
            <span>이미 계정이 있나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </div>
        <aside className="auth-benefits" aria-label="회원가입 혜택">
          <strong>커리어보드 회원 혜택</strong>
          <ul>
            {signupBenefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          <p>가입 후에는 자동 로그인되지 않고, 로그인 페이지에서 직접 접속합니다.</p>
        </aside>
      </section>
    </main>
  );
}

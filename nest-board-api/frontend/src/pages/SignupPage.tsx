import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";

export function SignupPage() {
  return (
    <PageShell description="회원가입 API 연결 전 입력 폼과 화면 흐름을 준비합니다." eyebrow="Auth" title="회원가입">
      <section className="auth-panel">
        <form className="auth-form">
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
          <button className="button button--primary" type="button">
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

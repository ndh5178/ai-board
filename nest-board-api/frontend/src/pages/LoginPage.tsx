import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";

export function LoginPage() {
  return (
    <PageShell description="NestJS 인증 API와 연결하기 전 로그인 화면 구조를 먼저 잡습니다." eyebrow="Auth" title="로그인">
      <section className="auth-panel">
        <form className="auth-form">
          <label>
            이메일
            <input name="email" placeholder="you@example.com" type="email" />
          </label>
          <label>
            비밀번호
            <input name="password" placeholder="비밀번호" type="password" />
          </label>
          <button className="button button--primary" type="button">
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

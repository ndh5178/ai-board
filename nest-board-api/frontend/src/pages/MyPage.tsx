import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";

export function MyPage() {
  const { user } = useAuth();

  return (
    <PageShell
      description="로그인한 사용자의 기본 정보를 확인하는 임시 마이페이지입니다."
      eyebrow="My"
      title="마이페이지"
    >
      <section className="section">
        <div className="profile-card">
          <div className="post-detail__avatar">{user?.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <p>{user?.email}</p>
          </div>
        </div>
        <div className="my-actions">
          <Link className="button button--secondary" to="/posts/new">
            글쓰기
          </Link>
          <Link className="button button--secondary" to="/posts">
            게시글 목록
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function MyPage() {
  const { user } = useAuth();
  const { posts } = usePosts();
  const myPosts = posts.filter((post) => post.authorEmail === user?.email);
  const myComments = posts.flatMap((post) => post.comments).filter((comment) => comment.authorEmail === user?.email);

  return (
    <PageShell
      description="로그인한 사용자의 계정 정보와 활동 요약을 확인하는 공간입니다."
      eyebrow="My"
      title="내 정보"
    >
      <section className="detail-panel">
        <h2>{user?.name}</h2>
        <p>이름: {user?.name}</p>
        <p>이메일: {user?.email}</p>
        <p>권한: USER</p>
      </section>
      <section className="my-dashboard" aria-label="내 활동 요약">
        <div>
          <strong>{myPosts.length}</strong>
          <span>내가 쓴 글</span>
        </div>
        <div>
          <strong>{myComments.length}</strong>
          <span>내 댓글</span>
        </div>
      </section>
      <section className="section">
        <div className="section__header">
          <h2>바로가기</h2>
        </div>
        <div className="my-actions">
          <Link className="button button--secondary" to="/posts/new">
            글쓰기
          </Link>
          <Link className="button button--secondary" to="/me/posts">
            내가 쓴 글 보기
          </Link>
          <Link className="button button--secondary" to="/me/comments">
            내 댓글 보기
          </Link>
          <Link className="button button--secondary" to="/settings">
            설정 보기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

import { Link, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { mockPosts } from "../data/mockPosts";

export function PostDetailPage() {
  const { id } = useParams();
  const post = mockPosts.find((item) => item.id === id);

  if (!post) {
    return (
      <PageShell eyebrow="Not Found" title="게시글을 찾을 수 없습니다" description="목록에서 다시 선택해 주세요.">
        <Link className="button button--secondary" to="/posts">
          목록으로
        </Link>
      </PageShell>
    );
  }

  return (
    <main className="page post-detail-page">
      <article className="post-detail">
        <header className="post-detail__header">
          <div className="tag-row">
            {post.tags.map((tag) => (
              <Link className="tag" key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`}>
                {tag}
              </Link>
            ))}
          </div>
          <h1>{post.title}</h1>
          <div className="post-detail__meta">
            <strong>{post.authorName}</strong>
            <span>{post.createdAt}</span>
            <span>댓글 {post.commentCount}</span>
          </div>
          <div className="post-detail__actions">
            <Link className="button button--secondary" to="/posts">
              목록으로
            </Link>
            <Link className="button button--primary" to="/posts/new">
              새 글쓰기
            </Link>
          </div>
        </header>
        <div className="post-detail__content">
          <p>{post.content}</p>
        </div>
        <section className="post-detail__comments">
          <div className="section__header">
            <h2>댓글</h2>
            <span className="section__badge">Mock</span>
          </div>
          <form className="comment-form">
            <label>
              댓글 내용
              <textarea placeholder="API 연결 후 댓글을 저장합니다." rows={4} />
            </label>
            <button className="button button--primary" type="button">
              댓글 등록
            </button>
          </form>
        </section>
      </article>
    </main>
  );
}

import { Link, useNavigate, useParams } from "react-router-dom";
import { CommentSection } from "../components/CommentSection";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deletePost, getPostById } = usePosts();
  const post = getPostById(id);

  if (!post) {
    return (
      <PageShell eyebrow="Not Found" title="게시글을 찾을 수 없습니다" description="목록에서 다시 선택해 주세요.">
        <Link className="button button--secondary" to="/posts">
          목록으로
        </Link>
      </PageShell>
    );
  }

  const isAuthor = post.authorEmail === user?.email;
  const handleDelete = () => {
    const confirmed = window.confirm("게시글을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    deletePost(post.id);
    navigate("/posts", { replace: true });
  };

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
            {isAuthor ? (
              <>
                <Link className="button button--secondary" to={`/posts/${post.id}/edit`}>
                  수정
                </Link>
                <button className="button button--danger" onClick={handleDelete} type="button">
                  삭제
                </button>
              </>
            ) : null}
          </div>
        </header>
        <div className="post-detail__content">
          <p>{post.content}</p>
        </div>
        <CommentSection post={post} />
      </article>
    </main>
  );
}

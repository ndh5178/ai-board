import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { CommentSection } from "../components/CommentSection";
import { PageShell } from "../components/PageShell";
import { usePosts } from "../posts/PostContext";

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deletePost, fetchPostById, getPostById, posts } = usePosts();
  const [message, setMessage] = useState("");
  const post = getPostById(id);

  useEffect(() => {
    let ignore = false;

    async function loadPost() {
      const result = await fetchPostById(id);

      if (!ignore && !result.ok) {
        setMessage(result.message);
      }
    }

    void loadPost();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (!post) {
    return (
      <PageShell eyebrow="Not Found" title="게시글을 찾을 수 없습니다" description="목록에서 다시 선택해 주세요.">
        {message ? <p className="form-message">{message}</p> : null}
        <Link className="button button--secondary" to="/posts">
          목록으로
        </Link>
      </PageShell>
    );
  }

  const isAuthor = post.authorEmail === user?.email;
  const postIndex = posts.findIndex((item) => item.id === post.id);
  const previousPost = postIndex >= 0 ? posts[postIndex + 1] : undefined;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : undefined;

  const handleDelete = async () => {
    const confirmed = window.confirm("게시글을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    const result = await deletePost(post.id);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

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
            {message ? <p className="form-message">{message}</p> : null}
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
                <button className="button button--danger" onClick={() => void handleDelete()} type="button">
                  삭제
                </button>
              </>
            ) : null}
          </div>
        </header>
        <div className="post-detail__content">
          <p>{post.content}</p>
        </div>
        {previousPost || nextPost ? (
          <nav className="post-detail__nav" aria-label="이전글 다음글">
            {previousPost ? (
              <Link className="post-detail__nav-link" to={`/posts/${previousPost.id}`}>
                <span>이전글</span>
                <strong>{previousPost.title}</strong>
                <small>{previousPost.createdAt}</small>
              </Link>
            ) : null}
            {nextPost ? (
              <Link className="post-detail__nav-link post-detail__nav-link--next" to={`/posts/${nextPost.id}`}>
                <span>다음글</span>
                <strong>{nextPost.title}</strong>
                <small>{nextPost.createdAt}</small>
              </Link>
            ) : null}
          </nav>
        ) : null}
        <CommentSection post={post} />
      </article>
    </main>
  );
}

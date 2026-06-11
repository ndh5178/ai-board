import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";
import type { PostSummary } from "../types/post";

type CommentSectionProps = {
  post: PostSummary;
};

export function CommentSection({ post }: CommentSectionProps) {
  const { user } = useAuth();
  const { addComment, removeComment } = usePosts();
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setMessage("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "").trim();

    if (!content) {
      setMessage("댓글 내용을 입력해 주세요.");
      return;
    }

    addComment(post.id, {
      authorEmail: user.email,
      authorName: user.name,
      content,
    });
    setMessage("");
    form.reset();
  };

  return (
    <section className="post-detail__comments">
      <div className="section__header">
        <h2>댓글 {post.comments.length}</h2>
        <span className="section__badge">Local</span>
      </div>
      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label>
            댓글 내용
            <textarea name="content" placeholder="댓글을 입력하세요" rows={4} />
          </label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="button button--primary">댓글 등록</button>
        </form>
      ) : (
        <div className="empty-state empty-state--compact">
          <p>댓글을 작성하려면 로그인이 필요합니다.</p>
          <Link className="button button--secondary" to="/login">
            로그인
          </Link>
        </div>
      )}
      {message && !user ? <p className="form-message">{message}</p> : null}
      <div className="comments">
        {post.comments.length > 0 ? (
          post.comments.map((comment) => {
            const canRemove = comment.authorEmail === user?.email || post.authorEmail === user?.email;

            return (
              <article className="comment" key={comment.id}>
                <div className="comment__meta">
                  <strong>{comment.authorName}</strong>
                  <span>{comment.createdAt}</span>
                </div>
                <p className="comment__body">{comment.content}</p>
                {canRemove ? (
                  <div className="comment__actions">
                    <button onClick={() => removeComment(post.id, comment.id)} type="button">
                      삭제
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="empty-state empty-state--compact">
            <p>아직 댓글이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}

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
  const { addComment, removeComment, updateComment } = usePosts();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsSubmitting(true);
    const result = await addComment(post.id, {
      authorEmail: user.email,
      authorName: user.name,
      content,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage("");
    form.reset();
  };
  const handleEdit = async (event: FormEvent<HTMLFormElement>, commentId: string) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") ?? "").trim();

    if (!content) {
      setMessage("수정할 댓글 내용을 입력해 주세요.");
      return;
    }

    const result = await updateComment(post.id, commentId, content);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setEditingCommentId(null);
    setMessage("");
  };

  const handleRemove = async (commentId: string) => {
    const result = await removeComment(post.id, commentId);

    if (!result.ok) {
      setMessage(result.message);
    }
  };

  return (
    <section className="post-detail__comments">
      <div className="section__header">
        <h2>댓글 {post.comments.length}</h2>
        <span className="section__badge">API</span>
      </div>
      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label>
            댓글 내용
            <textarea name="content" placeholder="댓글을 입력하세요" rows={4} />
          </label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? "등록 중" : "댓글 등록"}
          </button>
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
                {editingCommentId === comment.id ? (
                  <form className="comment__edit-form" onSubmit={(event) => handleEdit(event, comment.id)}>
                    <label>
                      댓글 수정
                      <textarea defaultValue={comment.content} name="content" rows={3} />
                    </label>
                    <div className="comment__edit-actions">
                      <button className="button button--primary">수정 완료</button>
                      <button
                        className="button button--secondary"
                        onClick={() => setEditingCommentId(null)}
                        type="button"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="comment__body">{comment.content}</p>
                )}
                {canRemove && editingCommentId !== comment.id ? (
                  <div className="comment__actions">
                    {comment.authorEmail === user?.email ? (
                      <button onClick={() => setEditingCommentId(comment.id)} type="button">
                        수정
                      </button>
                    ) : null}
                    <button onClick={() => void handleRemove(comment.id)} type="button">
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

import type { Comment } from "@/types/comment";
import { CommentActions } from "@/components/comments/CommentActions";

type CommentListProps = {
  comments: Comment[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <section className="empty-state" aria-label="댓글 없음">
        <h2>아직 댓글이 없습니다</h2>
        <p>첫 댓글을 남겨 대화를 시작해 보세요.</p>
      </section>
    );
  }

  return (
    <section className="comments" aria-label="댓글 목록">
      {comments.map((comment) => (
        <article key={comment.id} className="comment">
          <div className="comment__meta">
            <strong>{comment.authorName}</strong>
            <span>{comment.createdAt}</span>
          </div>
          <p>{comment.content}</p>
          {comment.canManage ? (
            <CommentActions
              commentId={comment.id}
              initialContent={comment.content}
            />
          ) : null}
        </article>
      ))}
    </section>
  );
}

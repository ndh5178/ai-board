import type { Comment } from "@/types/comment";

type CommentListProps = {
  comments: Comment[];
};

export function CommentList({ comments }: CommentListProps) {
  return (
    <section className="comments" aria-label="댓글 목록">
      {comments.map((comment) => (
        <article key={comment.id} className="comment">
          <div className="comment__meta">
            <strong>{comment.authorName}</strong>
            <span>{comment.createdAt}</span>
          </div>
          <p>{comment.content}</p>
        </article>
      ))}
    </section>
  );
}

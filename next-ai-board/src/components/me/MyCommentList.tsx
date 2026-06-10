import Link from "next/link";

type MyComment = {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  postTitle: string;
};

type MyCommentListProps = {
  comments: MyComment[];
};

export function MyCommentList({ comments }: MyCommentListProps) {
  if (comments.length === 0) {
    return (
      <section className="empty-state" aria-label="내 댓글 없음">
        <h2>아직 작성한 댓글이 없습니다</h2>
        <p>관심 있는 게시글에 댓글을 남기면 이곳에서 다시 확인할 수 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="my-list" aria-label="내 댓글 목록">
      {comments.map((comment) => (
        <article className="my-list__item" key={comment.id}>
          <div>
            <Link href={`/posts/${comment.postId}`}>
              <h2>{comment.postTitle}</h2>
            </Link>
            <p>{comment.content}</p>
          </div>
          <span>{comment.createdAt}</span>
        </article>
      ))}
    </section>
  );
}

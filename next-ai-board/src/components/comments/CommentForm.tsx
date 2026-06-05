export function CommentForm() {
  return (
    <form className="comment-form">
      <label>
        댓글
        <textarea name="comment" placeholder="댓글을 입력하세요" rows={4} />
      </label>
      <button className="button button--secondary" type="button">
        댓글 등록
      </button>
    </form>
  );
}

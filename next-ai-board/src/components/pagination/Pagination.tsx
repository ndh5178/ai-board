export function Pagination() {
  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button type="button" disabled>
        이전
      </button>
      <span>1</span>
      <button type="button">다음</button>
    </nav>
  );
}

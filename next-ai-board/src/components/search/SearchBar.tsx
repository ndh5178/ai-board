export function SearchBar() {
  return (
    <form className="search-bar">
      <input name="q" placeholder="제목, 본문, 태그 검색" type="search" />
      <button className="button button--primary" type="button">
        검색
      </button>
    </form>
  );
}

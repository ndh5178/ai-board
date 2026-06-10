type SearchBarProps = {
  query?: string;
  tag?: string;
};

export function SearchBar({ query = "", tag = "" }: SearchBarProps) {
  return (
    <form className="search-bar">
      <input
        name="q"
        placeholder="제목, 본문, 태그 검색"
        type="search"
        defaultValue={query}
      />
      {tag ? <input name="tag" type="hidden" value={tag} /> : null}
      <button className="button button--primary">
        검색
      </button>
    </form>
  );
}

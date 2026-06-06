type SearchBarProps = {
  query?: string;
};

export function SearchBar({ query = "" }: SearchBarProps) {
  return (
    <form className="search-bar">
      <input
        name="q"
        placeholder="제목, 본문, 태그 검색"
        type="search"
        defaultValue={query}
      />
      <button className="button button--primary">
        검색
      </button>
    </form>
  );
}

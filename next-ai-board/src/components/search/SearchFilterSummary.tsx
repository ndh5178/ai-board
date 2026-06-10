import Link from "next/link";

type SearchFilterSummaryProps = {
  query?: string;
  tag?: string;
  totalCount: number;
};

export function SearchFilterSummary({
  query = "",
  tag = "",
  totalCount,
}: SearchFilterSummaryProps) {
  const hasFilter = Boolean(query || tag);

  return (
    <div className="filter-summary">
      <div>
        <strong>{totalCount}개 결과</strong>
        {hasFilter ? (
          <p>
            {query ? <span>검색어: {query}</span> : null}
            {tag ? <span>태그: {tag}</span> : null}
          </p>
        ) : (
          <p>전체 게시글을 최신순으로 보고 있습니다.</p>
        )}
      </div>
      {hasFilter ? (
        <Link className="filter-summary__reset" href="/posts">
          필터 초기화
        </Link>
      ) : null}
    </div>
  );
}

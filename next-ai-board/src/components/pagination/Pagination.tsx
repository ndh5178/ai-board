import Link from "next/link";

type PaginationProps = {
  currentPage?: number;
  totalPages?: number;
  query?: string;
  tag?: string;
};

function buildPageHref(page: number, query = "", tag = "") {
  const searchParams = new URLSearchParams();

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  if (query) {
    searchParams.set("q", query);
  }

  if (tag) {
    searchParams.set("tag", tag);
  }

  const queryString = searchParams.toString();

  return queryString ? `/posts?${queryString}` : "/posts";
}

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  query = "",
  tag = "",
}: PaginationProps) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {hasPrevious ? (
        <Link href={buildPageHref(currentPage - 1, query, tag)}>이전</Link>
      ) : (
        <span aria-disabled="true">이전</span>
      )}
      <span>
        {currentPage} / {totalPages}
      </span>
      {hasNext ? (
        <Link href={buildPageHref(currentPage + 1, query, tag)}>다음</Link>
      ) : (
        <span aria-disabled="true">다음</span>
      )}
    </nav>
  );
}

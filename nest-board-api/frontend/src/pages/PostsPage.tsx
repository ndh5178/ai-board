import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { PageShell } from "../components/PageShell";
import { PostList } from "../components/PostList";
import { usePosts } from "../posts/PostContext";

export function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loadPosts, page: currentPage, popularTags, posts, totalCount, totalPages } = usePosts();
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const pageSize = 10;
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchPosts() {
      const result = await loadPosts({
        page,
        pageSize,
        q: query,
        tag,
      });

      if (!ignore && !result.ok) {
        setMessage(result.message);
      }
    }

    void fetchPosts();

    return () => {
      ignore = true;
    };
  }, [page, query, tag]);

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  };

  return (
    <PageShell
      actions={<ButtonLink to="/posts/new">글쓰기</ButtonLink>}
      description={`저장된 게시글 ${totalCount}개를 검색하고 태그로 탐색합니다.`}
      eyebrow="채용정보"
      title="게시글 목록"
    >
      {message ? <p className="form-message">{message}</p> : null}
      <section className="toolbar">
        <form
          className="search-bar"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const nextQuery = String(formData.get("q") ?? "").trim();
            const nextParams = new URLSearchParams();

            if (nextQuery) {
              nextParams.set("q", nextQuery);
            }

            if (tag) {
              nextParams.set("tag", tag);
            }

            setSearchParams(nextParams);
          }}
        >
          <input defaultValue={query} name="q" placeholder="검색어를 입력해 주세요" />
          <button className="button button--primary">검색</button>
        </form>
        <div className="tag-row">
          {popularTags.map((tagName) => (
            <button
              className={`tag ${tagName === tag ? "tag--active" : ""}`}
              key={tagName}
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set("tag", tagName);
                setSearchParams(nextParams);
              }}
              type="button"
            >
              {tagName}
            </button>
          ))}
          {tag ? (
            <button className="tag" onClick={() => setSearchParams({})} type="button">
              필터 초기화
            </button>
          ) : null}
        </div>
      </section>
      <PostList posts={posts} />
      {totalPages > 1 ? (
        <nav className="pagination" aria-label="게시글 페이지">
          <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">
            이전
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              className={pageNumber === currentPage ? "pagination__active" : undefined}
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} type="button">
            다음
          </button>
        </nav>
      ) : null}
    </PageShell>
  );
}

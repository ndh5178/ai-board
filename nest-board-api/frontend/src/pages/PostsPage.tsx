import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { PageShell } from "../components/PageShell";
import { PostList } from "../components/PostList";
import { usePosts } from "../posts/PostContext";

export function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { popularTags, posts } = usePosts();
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const pageSize = 3;
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase());
      const matchesTag = !tag || post.tags.includes(tag);

      return matchesQuery && matchesTag;
    });
  }, [posts, query, tag]);
  const totalPages = Math.max(Math.ceil(filteredPosts.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  };

  return (
    <PageShell
      actions={<ButtonLink to="/posts/new">글쓰기</ButtonLink>}
      description={`임시 저장소에 있는 게시글 ${filteredPosts.length}개를 검색하고 태그로 탐색합니다.`}
      eyebrow="Posts"
      title="게시글 목록"
    >
      <section className="toolbar">
        <form
          className="search-bar"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const nextQuery = String(formData.get("q") ?? "");
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
          <input defaultValue={query} name="q" placeholder="검색어를 입력하세요" />
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
      <PostList posts={pagedPosts} />
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

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { PageShell } from "../components/PageShell";
import { PostList } from "../components/PostList";
import { mockPosts, popularTags } from "../data/mockPosts";

export function PostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const filteredPosts = useMemo(() => {
    return mockPosts.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase());
      const matchesTag = !tag || post.tags.includes(tag);

      return matchesQuery && matchesTag;
    });
  }, [query, tag]);

  return (
    <PageShell
      actions={<ButtonLink to="/posts/new">글쓰기</ButtonLink>}
      description={`현재는 mock 데이터 ${filteredPosts.length}개를 보여주고, 다음 이슈에서 NestJS API와 연결합니다.`}
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
        </div>
      </section>
      <PostList posts={filteredPosts} />
    </PageShell>
  );
}

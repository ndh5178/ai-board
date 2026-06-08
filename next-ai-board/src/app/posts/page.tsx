import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageShell } from "@/components/layout/PageShell";
import { Pagination } from "@/components/pagination/Pagination";
import { PostList } from "@/components/posts/PostList";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilterSummary } from "@/components/search/SearchFilterSummary";
import { TagBadge } from "@/components/tags/TagBadge";
import { getPopularTags, listPosts } from "@/lib/posts";

type PostsPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    tag?: string;
  }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const query = params?.q ?? "";
  const tag = params?.tag ?? "";
  const [{ posts, currentPage, totalPages, totalCount }, popularTags] =
    await Promise.all([
      listPosts({
        page: Number.isNaN(page) ? 1 : page,
        query,
        tag,
      }),
      getPopularTags(),
    ]);
  const buildTagHref = (tagName: string) => {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("q", query);
    }

    nextParams.set("tag", tagName);

    return `/posts?${nextParams.toString()}`;
  };
  const emptyTitle = query || tag ? "조건에 맞는 게시글이 없습니다" : undefined;
  const emptyMessage =
    query || tag
      ? "검색어를 바꾸거나 필터를 초기화해 다시 확인해 보세요."
      : undefined;

  return (
    <PageShell
      eyebrow="Posts"
      title="전체글"
      description={`DB에 저장된 게시글 ${totalCount}개를 검색하고 태그로 탐색합니다.`}
      actions={<ButtonLink href="/posts/new">글쓰기</ButtonLink>}
    >
      <section className="toolbar">
        <SearchBar query={query} tag={tag} />
        <div className="tag-row">
          {popularTags.map((tagName) => (
            <TagBadge
              active={tagName.toLowerCase() === tag.toLowerCase()}
              key={tagName}
              label={tagName}
              href={buildTagHref(tagName)}
            />
          ))}
        </div>
        <SearchFilterSummary query={query} tag={tag} totalCount={totalCount} />
      </section>
      <PostList
        emptyMessage={emptyMessage}
        emptyTitle={emptyTitle}
        posts={posts}
      />
      <Pagination
        currentPage={currentPage}
        query={query}
        tag={tag}
        totalPages={totalPages}
      />
    </PageShell>
  );
}

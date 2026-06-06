import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageShell } from "@/components/layout/PageShell";
import { Pagination } from "@/components/pagination/Pagination";
import { PostList } from "@/components/posts/PostList";
import { SearchBar } from "@/components/search/SearchBar";
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

  return (
    <PageShell
      eyebrow="Posts"
      title="전체글"
      description={`DB에 저장된 게시글 ${totalCount}개를 검색하고 태그로 탐색합니다.`}
      actions={<ButtonLink href="/posts/new">글쓰기</ButtonLink>}
    >
      <section className="toolbar">
        <SearchBar query={query} />
        <div className="tag-row">
          {popularTags.map((tagName) => (
            <TagBadge
              key={tagName}
              label={tagName}
              href={`/posts?tag=${encodeURIComponent(tagName)}`}
            />
          ))}
        </div>
      </section>
      <PostList posts={posts} />
      <Pagination
        currentPage={currentPage}
        query={query}
        tag={tag}
        totalPages={totalPages}
      />
    </PageShell>
  );
}

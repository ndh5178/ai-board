import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageShell } from "@/components/layout/PageShell";
import { Pagination } from "@/components/pagination/Pagination";
import { PostList } from "@/components/posts/PostList";
import { SearchBar } from "@/components/search/SearchBar";
import { TagBadge } from "@/components/tags/TagBadge";
import { mockPosts, popularTags } from "@/lib/mock-posts";

export default function PostsPage() {
  return (
    <PageShell
      eyebrow="Board"
      title="게시글"
      description="검색, 태그, 페이징으로 필요한 글을 빠르게 찾습니다."
      actions={<ButtonLink href="/posts/new">글쓰기</ButtonLink>}
    >
      <section className="toolbar">
        <SearchBar />
        <div className="tag-row">
          {popularTags.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
      </section>
      <PostList posts={mockPosts} />
      <Pagination />
    </PageShell>
  );
}

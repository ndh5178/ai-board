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
      eyebrow="Ranking"
      title="장르별 게시글 랭킹"
      description="AI, DB, 백엔드, 프론트엔드 주제별로 지금 많이 읽히는 글을 빠르게 찾습니다."
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

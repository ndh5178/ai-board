import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { getTagStats } from "@/lib/posts";

export default async function TagsPage() {
  const tags = await getTagStats();

  return (
    <PageShell
      eyebrow="Tags"
      title="태그"
      description="게시글에 사용된 태그를 모아보고, 태그별 게시글로 이동합니다."
    >
      {tags.length > 0 ? (
        <section className="tag-grid" aria-label="태그 목록">
          {tags.map((tag) => (
            <Link
              className="tag-card"
              href={`/posts?tag=${encodeURIComponent(tag.name)}`}
              key={tag.id}
            >
              <strong>{tag.name}</strong>
              <span>{tag.postCount}개 게시글</span>
            </Link>
          ))}
        </section>
      ) : (
        <section className="empty-state" aria-label="태그 없음">
          <h2>아직 태그가 없습니다</h2>
          <p>게시글을 작성하면서 태그를 입력하면 이곳에 표시됩니다.</p>
        </section>
      )}
    </PageShell>
  );
}

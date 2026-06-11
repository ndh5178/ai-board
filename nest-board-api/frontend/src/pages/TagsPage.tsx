import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { usePosts } from "../posts/PostContext";

export function TagsPage() {
  const { popularTags } = usePosts();

  return (
    <PageShell description="게시글 태그를 모아서 보여주는 화면입니다." eyebrow="Tags" title="태그">
      <section className="tag-grid">
        {popularTags.map((tag) => (
          <Link className="tag-card" key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`}>
            <strong>{tag}</strong>
            <span>관련 게시글 보기</span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

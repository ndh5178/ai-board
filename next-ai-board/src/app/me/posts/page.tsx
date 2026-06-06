import { PageShell } from "@/components/layout/PageShell";
import { requireAuth } from "@/lib/require-auth";

export default async function MyPostsPage() {
  await requireAuth("/me/posts");

  return (
    <PageShell
      description="내가 작성한 게시글을 모아서 관리할 예정인 페이지입니다."
      eyebrow="My"
      title="내가 쓴 글"
    >
      <section className="detail-panel">
        <p>게시글 API 연결 후 내가 작성한 글 목록이 표시됩니다.</p>
      </section>
    </PageShell>
  );
}

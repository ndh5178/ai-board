import { PageShell } from "@/components/layout/PageShell";
import { requireAuth } from "@/lib/require-auth";

export default async function MyCommentsPage() {
  await requireAuth("/me/comments");

  return (
    <PageShell
      description="내가 남긴 댓글을 모아서 확인할 예정인 페이지입니다."
      eyebrow="My"
      title="내 댓글"
    >
      <section className="detail-panel">
        <p>댓글 API 연결 후 내가 작성한 댓글 목록이 표시됩니다.</p>
      </section>
    </PageShell>
  );
}

import { PageShell } from "@/components/layout/PageShell";
import { MyCommentList } from "@/components/me/MyCommentList";
import { listMyComments } from "@/lib/my-page";
import { requireAuth } from "@/lib/require-auth";

export default async function MyCommentsPage() {
  const session = await requireAuth("/me/comments");
  const comments = await listMyComments(session.userId);

  return (
    <PageShell
      description="내가 남긴 댓글을 모아서 확인합니다."
      eyebrow="My"
      title="내 댓글"
    >
      <MyCommentList comments={comments} />
    </PageShell>
  );
}

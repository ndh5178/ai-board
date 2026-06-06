import { PageShell } from "@/components/layout/PageShell";
import { requireAuth } from "@/lib/require-auth";

export default async function MyPage() {
  const session = await requireAuth("/me");

  return (
    <PageShell
      description="로그인한 사용자의 계정 정보와 활동 요약을 확인하는 공간입니다."
      eyebrow="My"
      title="내 정보"
    >
      <section className="detail-panel">
        <h2>{session.email}</h2>
        <p>역할: {session.role}</p>
        <p>사용자 ID: {session.userId}</p>
      </section>
    </PageShell>
  );
}

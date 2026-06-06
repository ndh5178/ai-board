import { PageShell } from "@/components/layout/PageShell";
import { requireAuth } from "@/lib/require-auth";

export default async function SettingsPage() {
  await requireAuth("/settings");

  return (
    <PageShell
      description="프로필, 알림, AI 기능 설정을 관리할 예정인 페이지입니다."
      eyebrow="My"
      title="설정"
    >
      <section className="detail-panel">
        <p>계정 설정 UI는 다음 인증 UI 작업에서 확장합니다.</p>
      </section>
    </PageShell>
  );
}

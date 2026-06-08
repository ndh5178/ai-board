import { PageShell } from "@/components/layout/PageShell";
import { getMyPageSummary } from "@/lib/my-page";
import { requireAuth } from "@/lib/require-auth";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const session = await requireAuth("/settings");
  const summary = await getMyPageSummary(session.userId);

  if (!summary) {
    notFound();
  }

  return (
    <PageShell
      description="현재 계정 정보를 확인합니다. 실제 수정 기능은 다음 단계에서 확장합니다."
      eyebrow="My"
      title="설정"
    >
      <section className="detail-panel">
        <h2>{summary.name}</h2>
        <p>이름: {summary.name}</p>
        <p>이메일: {summary.email}</p>
        <p>권한: {summary.role}</p>
      </section>
    </PageShell>
  );
}

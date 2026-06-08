import { PageShell } from "@/components/layout/PageShell";
import { DeleteAccountForm } from "@/components/me/DeleteAccountForm";
import { PasswordChangeForm } from "@/components/me/PasswordChangeForm";
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
      description="현재 계정 정보를 확인하고 비밀번호 변경, 회원 탈퇴를 관리합니다."
      eyebrow="My"
      title="설정"
    >
      <section className="detail-panel">
        <h2>{summary.name}</h2>
        <p>이름: {summary.name}</p>
        <p>이메일: {summary.email}</p>
        <p>권한: {summary.role}</p>
      </section>
      <section className="settings-grid" aria-label="계정 설정">
        <article className="settings-panel">
          <div>
            <h2>비밀번호 변경</h2>
            <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
          </div>
          <PasswordChangeForm />
        </article>
        <article className="settings-panel settings-panel--danger">
          <div>
            <h2>회원 탈퇴</h2>
            <p>탈퇴 후에는 계정과 작성한 게시판 데이터를 되돌릴 수 없습니다.</p>
          </div>
          <DeleteAccountForm />
        </article>
      </section>
    </PageShell>
  );
}

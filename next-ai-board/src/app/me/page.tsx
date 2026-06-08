import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getMyPageSummary } from "@/lib/my-page";
import { requireAuth } from "@/lib/require-auth";
import { notFound } from "next/navigation";

export default async function MyPage() {
  const session = await requireAuth("/me");
  const summary = await getMyPageSummary(session.userId);

  if (!summary) {
    notFound();
  }

  return (
    <PageShell
      description="로그인한 사용자의 계정 정보와 활동 요약을 확인하는 공간입니다."
      eyebrow="My"
      title="내 정보"
    >
      <section className="detail-panel">
        <h2>{summary.name}</h2>
        <p>이메일: {summary.email}</p>
        <p>역할: {summary.role}</p>
        <p>가입일: {summary.createdAt}</p>
      </section>
      <section className="my-dashboard" aria-label="내 활동 요약">
        <div>
          <strong>{summary.postCount}</strong>
          <span>내가 쓴 글</span>
        </div>
        <div>
          <strong>{summary.commentCount}</strong>
          <span>내 댓글</span>
        </div>
      </section>
      <section className="section">
        <div className="section__header">
          <h2>바로가기</h2>
        </div>
        <div className="my-actions">
          <ButtonLink href="/me/posts" variant="secondary">
            내가 쓴 글 보기
          </ButtonLink>
          <ButtonLink href="/me/comments" variant="secondary">
            내 댓글 보기
          </ButtonLink>
          <ButtonLink href="/settings" variant="secondary">
            설정 보기
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}

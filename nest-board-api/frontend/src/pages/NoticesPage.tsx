import { PageShell } from "../components/PageShell";

export function NoticesPage() {
  return (
    <PageShell description="서비스 공지와 업데이트를 모아보는 화면입니다." eyebrow="Notice" title="공지사항">
      <section className="section">
        <div className="my-list">
          <article className="my-list__item">
            <div>
              <h2>Nest Board 프론트엔드 구조 정리</h2>
              <p>Next.js 게시판 화면 흐름을 React + Vite 구조로 옮기는 중입니다.</p>
            </div>
            <span>2026-06-11</span>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

import { PageShell } from "../components/PageShell";

export function AiPage() {
  return (
    <PageShell
      description="RAG, MCP, Agent 기능은 AI 부모 이슈에서 NestJS 백엔드와 함께 연결합니다."
      eyebrow="AI"
      title="AI 도우미"
    >
      <section className="section">
        <div className="deal-grid">
          <article className="deal-card">
            <div className="deal-card__thumb">RAG</div>
            <strong>유사 게시글 추천</strong>
            <span>게시판 데이터 검색</span>
            <p>준비 중</p>
          </article>
          <article className="deal-card">
            <div className="deal-card__thumb">MCP</div>
            <strong>외부 데이터 브리핑</strong>
            <span>외부 API 연동</span>
            <p>준비 중</p>
          </article>
          <article className="deal-card">
            <div className="deal-card__thumb">Agent</div>
            <strong>글쓰기 보조</strong>
            <span>초안/태그 제안</span>
            <p>준비 중</p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

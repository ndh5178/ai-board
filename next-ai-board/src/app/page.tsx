import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PostList } from "@/components/posts/PostList";
import { getPopularTags, listPosts } from "@/lib/posts";

const dealItems = [
  { title: "AI 글쓰기 파트너", place: "Agent Studio", rate: "50%", price: "초안 자동 생성" },
  { title: "유사 게시글 추천", place: "RAG Lab", rate: "40%", price: "관련 글 3개 요약" },
  { title: "외부 데이터 브리핑", place: "MCP Hall", rate: "30%", price: "날씨/뉴스 연결" },
];

export default async function Home() {
  const [{ posts }, popularTags] = await Promise.all([
    listPosts({ page: 1 }),
    getPopularTags(),
  ]);
  const heroItems = posts.slice(0, 3);
  const genreItems = popularTags;

  return (
    <main className="ticket-page">
      <section className="ticket-hero">
        <div className="ticket-hero__copy">
          <p className="eyebrow">AI BOARD ORIGINAL</p>
          <h1>AI 게시판 랭킹 오픈</h1>
          <p>질문, 토론, 구현 기록을 티켓 랭킹처럼 탐색하고 AI 기능으로 확장합니다.</p>
          <div className="hero__actions">
            <ButtonLink href="/posts/new">글쓰기</ButtonLink>
            <ButtonLink href="/posts" variant="secondary">
              랭킹 보기
            </ButtonLink>
          </div>
        </div>
        <div className="ticket-hero__posters" aria-label="추천 게시글">
          {heroItems.length > 0 ? (
            heroItems.map((post, index) => (
              <article
                className="poster-card"
                key={post.id}
                style={{ "--poster-accent": post.accent } as React.CSSProperties}
              >
                <span className="poster-card__rank">{index + 1}</span>
                <strong>{post.title}</strong>
                <small>{post.venue}</small>
              </article>
            ))
          ) : (
            <article className="poster-card" style={{ "--poster-accent": "#ef3f7b" } as React.CSSProperties}>
              <span className="poster-card__rank">1</span>
              <strong>첫 게시글을 기다리는 중입니다</strong>
              <small>AI 게시판</small>
            </article>
          )}
        </div>
      </section>

      {genreItems.length > 0 ? (
        <section className="genre-strip" aria-label="장르 바로가기">
          {genreItems.map((tag) => (
            <Link href={`/posts?tag=${encodeURIComponent(tag)}`} key={tag}>
              {tag}
            </Link>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <h2>아직 태그가 없습니다</h2>
          <p>게시글을 작성하면서 태그를 입력하면 이곳에 표시됩니다.</p>
        </section>
      )}

      <section className="section">
        <div className="section__header">
          <h2>장르별 랭킹</h2>
          <ButtonLink href="/posts" variant="secondary">
            랭킹 전체보기
          </ButtonLink>
        </div>
        <PostList posts={posts} />
      </section>

      <section className="section">
        <div className="section__header">
          <h2>지금 준비중인 AI 기능</h2>
          <span className="section__badge">타임딜</span>
        </div>
        <div className="deal-grid">
          {dealItems.map((item) => (
            <article className="deal-card" key={item.title}>
              <div className="deal-card__thumb">{item.rate}</div>
              <strong>{item.title}</strong>
              <span>{item.place}</span>
              <p>{item.price}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

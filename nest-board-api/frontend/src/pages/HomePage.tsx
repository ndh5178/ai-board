import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { PostList } from "../components/PostList";
import { mockPosts, popularTags } from "../data/mockPosts";

const dealItems = [
  { title: "NestJS API 서버", place: "Backend", rate: "API", price: "Controller -> Service -> DB" },
  { title: "React 프론트엔드", place: "Frontend", rate: "UI", price: "Page -> Component -> API" },
  { title: "AI 확장 기능", place: "AI", rate: "RAG", price: "RAG / MCP / Agent" },
];

export function HomePage() {
  const heroItems = mockPosts.slice(0, 3);

  return (
    <main className="ticket-page">
      <section className="ticket-hero">
        <div className="ticket-hero__copy">
          <p className="eyebrow">NEST BOARD ORIGINAL</p>
          <h1>Nest 게시판 랭킹 오픈</h1>
          <p>NestJS 백엔드와 React 프론트엔드를 분리해 게시판 전체 흐름을 다시 구현합니다.</p>
          <div className="hero__actions">
            <ButtonLink to="/posts/new">글쓰기</ButtonLink>
            <ButtonLink to="/posts" variant="secondary">
              게시글 보기
            </ButtonLink>
          </div>
        </div>
        <div className="ticket-hero__posters" aria-label="추천 게시글">
          {heroItems.map((post, index) => (
            <article
              className="poster-card"
              key={post.id}
              style={{ "--poster-accent": post.accent } as CSSProperties}
            >
              <span className="poster-card__rank">{index + 1}</span>
              <strong>{post.title}</strong>
              <small>{post.authorName}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="genre-strip" aria-label="태그 바로가기">
        {popularTags.slice(0, 8).map((tag) => (
          <Link key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`}>
            {tag}
          </Link>
        ))}
      </section>

      <section className="section">
        <div className="section__header">
          <h2>게시글 랭킹</h2>
          <ButtonLink to="/posts" variant="secondary">
            전체보기
          </ButtonLink>
        </div>
        <PostList posts={mockPosts} />
      </section>

      <section className="section">
        <div className="section__header">
          <h2>구현 예정 영역</h2>
          <span className="section__badge">Roadmap</span>
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

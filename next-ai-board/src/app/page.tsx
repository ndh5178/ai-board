import { ButtonLink } from "@/components/ui/ButtonLink";
import { PostList } from "@/components/posts/PostList";
import { mockPosts } from "@/lib/mock-posts";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">next-ai-board</p>
          <h1>AI Board</h1>
          <p>질문과 아이디어를 모으고, AI 기능을 단계적으로 연결하는 게시판입니다.</p>
        </div>
        <div className="hero__actions">
          <ButtonLink href="/posts/new">글쓰기</ButtonLink>
          <ButtonLink href="/posts" variant="secondary">
            게시글 보기
          </ButtonLink>
        </div>
      </section>
      <section className="section">
        <div className="section__header">
          <h2>최신 게시글</h2>
          <ButtonLink href="/posts" variant="secondary">
            전체 보기
          </ButtonLink>
        </div>
        <PostList posts={mockPosts.slice(0, 2)} />
      </section>
    </main>
  );
}

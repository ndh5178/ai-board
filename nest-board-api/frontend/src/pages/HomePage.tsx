import { Link } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { usePosts } from "../posts/PostContext";

const emptyCards = [
  {
    description: "회원이 작성한 커리어 고민, 채용 정보, 학습 기록이 주요채용 카드처럼 노출됩니다.",
    title: "첫 게시글을 등록해 보세요",
  },
  {
    description: "태그를 입력하면 검색과 추천 영역에서 더 쉽게 발견됩니다.",
    title: "태그 기반 탐색 준비 완료",
  },
  {
    description: "로그인 후 글을 작성하면 댓글과 마이페이지 기능까지 함께 연결됩니다.",
    title: "게시판 API 연결 대기 중",
  },
  {
    description: "백엔드와 DB를 실행하면 실제 게시글 데이터가 이 영역에 바로 표시됩니다.",
    title: "실시간 데이터 반영",
  },
];

export function HomePage() {
  const { posts, totalCount } = usePosts();
  const primaryPosts = posts.slice(0, 12);

  return (
    <main className="saramin-main">
      <section aria-labelledby="h-primary-products" id="section_banner" className="main_product">
        <div className="main_product__header">
          <div>
            <div className="main_product__title-row">
              <h2 id="h-primary-products">
                게시글
              </h2>
            </div>
          </div>
          <div className="main_product__actions">
            <span>전체 {totalCount}개</span>
            <ButtonLink to="/posts" variant="secondary">
              전체보기
            </ButtonLink>
          </div>
        </div>

        {primaryPosts.length > 0 ? (
          <div className="product-grid">
            {primaryPosts.map((post) => (
              <article className="product-card" key={post.id}>
                <div className="product-card__surface">
                  <Link className="product-card__link" to={`/posts/${post.id}`}>
                    <strong className="product-card__company">{post.authorName}</strong>
                    <h3>{post.title}</h3>
                    <div className="product-card__details">
                      <p>{post.excerpt}</p>
                    </div>
                  </Link>
                  <div className="product-card__footer">
                    <div className="product-card__tags">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Link key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`}>
                          {tag}
                        </Link>
                      ))}
                    </div>
                    <div className="product-card__meta">
                      <span>댓글 {post.commentCount}</span>
                      <span>{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="product-grid product-grid--empty">
            {emptyCards.map((card) => (
              <article className="product-card product-card--empty" key={card.title}>
                <div className="product-card__surface">
                  <div className="product-card__top">
                    <span className="product-card__badge">커리어보드</span>
                    <span className="product-card__deadline">Ready</span>
                  </div>
                  <strong className="product-card__company">게시글 준비 영역</strong>
                  <h3>{card.title}</h3>
                  <div className="product-card__details">
                    <p>{card.description}</p>
                    <div className="product-card__condition">
                      <span>API 연결형</span>
                      <span>반응형 카드</span>
                      <span>배포 준비</span>
                    </div>
                    <div className="product-card__meta">
                      <span>API 연결형</span>
                      <span>배포 준비</span>
                    </div>
                  </div>
                  <div className="product-card__footer">
                    <div className="product-card__tags">
                      <span>준비됨</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            <div className="product-empty-cta">
              <strong>실제 데이터로 채워보고 싶다면</strong>
              <p>백엔드와 DB를 실행한 뒤 게시글을 작성하면 이 영역이 실제 게시글 카드로 바뀝니다.</p>
              <ButtonLink to="/posts/new">첫 글 작성하기</ButtonLink>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/posts", label: "전체 게시글" },
  { to: "/tags", label: "태그" },
  { to: "/notices", label: "공지사항" },
];

const menuSections = [
  {
    title: "공고를 찾는다면 채용정보",
    links: [
      { to: "/posts?tag=서울", label: "지역별" },
      { to: "/tags", label: "직업별" },
      { to: "/posts?tag=신입", label: "신입·인턴" },
      { to: "/posts", label: "HOT100" },
    ],
  },
  {
    title: "취업·이직이 답답할 땐",
    links: [
      { to: "/ai", label: "AI 서류합격 코칭" },
      { to: "/posts/new", label: "맞춤법 검사" },
      { to: "/notices", label: "이력서 양식" },
      { to: "/me", label: "내 활동 분석" },
    ],
  },
  {
    title: "커뮤니티",
    links: [
      { to: "/notices", label: "커리어피드 홈" },
      { to: "/posts", label: "게시글 목록" },
      { to: "/posts/new", label: "글쓰기" },
      { to: "/tags", label: "관심 태그" },
    ],
  },
  {
    title: "MY",
    links: [
      { to: "/me", label: "마이페이지" },
      { to: "/me/posts", label: "내 글" },
      { to: "/me/comments", label: "내 댓글" },
      { to: "/settings", label: "설정" },
    ],
  },
];

export function SiteHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();

    navigate(query ? `/posts?q=${encodeURIComponent(query)}` : "/posts");
  };

  return (
    <header id="sri_header" className="site-header main bubble">
      <div className="site-header__top">
        <div className="site-header__utility-inner">
          <div className="site-header__member-links">
            {user ? (
              <>
                <Link to="/me">MY</Link>
                <Link to="/me/posts">내 글</Link>
                <Link to="/me/comments">내 댓글</Link>
                <Link to="/settings">설정</Link>
                <button onClick={logout} type="button">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login">로그인</Link>
                <Link to="/signup">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="site-header__inner">
        <Link className="site-header__brand" to="/">
          AI 게시판
        </Link>
        <form className="site-header__search" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="global-search">
            게시글 검색
          </label>
          <input id="global-search" name="q" placeholder="직무, 회사, 지역, 키워드로 검색해보세요" />
          <button type="submit">검색</button>
        </form>
        <div className="site-header__quick">
          {user ? (
            <Link className="site-header__user" to="/me">
              {user.name}
            </Link>
          ) : (
            <Link className="site-header__login" to="/login">
              개인회원
            </Link>
          )}
          <Link className="site-header__write" to="/posts/new">
            게시글 작성
          </Link>
        </div>
      </div>

      <div className="site-header__nav-wrap">
        <nav className="site-header__nav" aria-label="주요 메뉴">
          <div className="site-header__menu">
            <div className="site-header__mega" aria-label="전체메뉴 상세">
              {menuSections.map((section) => (
                <div className="site-header__mega-section" key={section.title}>
                  <strong>{section.title}</strong>
                  {section.links.map((link) => (
                    <Link key={`${section.title}-${link.label}`} to={link.to}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? "site-header__nav-link--active" : undefined)}
              key={`${item.to}-${item.label}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

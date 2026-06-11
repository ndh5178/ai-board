import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/", label: "홈" },
  { to: "/posts", label: "게시글 목록" },
  { to: "/posts/new", label: "글쓰기" },
  { to: "/tags", label: "태그" },
  { to: "/ai", label: "AI 도우미" },
];

export function SiteHeader() {
  const { logout, user } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <Link to="/me">마이페이지</Link>
          <Link to="/me/posts">내가 쓴 글</Link>
          <Link to="/me/comments">내 댓글</Link>
          <Link to="/settings">설정</Link>
        </div>
      </div>
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/">
          Nest Board
        </Link>
        <nav className="site-header__nav" aria-label="주요 메뉴">
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
        {user ? (
          <div className="site-header__account">
            <Link className="site-header__user" to="/me">
              {user.name}
            </Link>
            <button className="site-header__logout" onClick={logout} type="button">
              로그아웃
            </button>
          </div>
        ) : (
          <Link className="site-header__login" to="/login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/posts", label: "랭킹" },
  { href: "/posts/new", label: "글쓰기" },
  { href: "/posts", label: "장르" },
  { href: "/posts", label: "오픈예정" },
  { href: "/posts", label: "할인" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <span>AI 티켓</span>
          <span>프로젝트</span>
          <span>학습노트</span>
          <span>내 예약</span>
        </div>
      </div>
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          티켓AI
        </Link>
        <nav className="site-header__nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="site-header__login" href="/login">
          로그인
        </Link>
      </div>
    </header>
  );
}

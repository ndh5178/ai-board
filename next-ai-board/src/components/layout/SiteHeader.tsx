import Link from "next/link";

const navItems = [
  { href: "/posts", label: "게시글" },
  { href: "/posts/new", label: "글쓰기" },
  { href: "/login", label: "로그인" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          AI Board
        </Link>
        <nav className="site-header__nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

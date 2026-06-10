import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/session";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/posts", label: "게시글 목록" },
  { href: "/posts/new", label: "글쓰기" },
  { href: "/tags", label: "태그" },
  { href: "/notices", label: "공지사항" },
  { href: "/ai", label: "AI 도우미" },
];

export async function SiteHeader() {
  const session = await getSession();
  const displayName = session?.name ?? session?.email;

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <Link href="/me">마이페이지</Link>
          <Link href="/me/posts">내가 쓴 글</Link>
          <Link href="/me/comments">내 댓글</Link>
          <Link href="/settings">설정</Link>
        </div>
      </div>
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          AI 게시판
        </Link>
        <nav className="site-header__nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        {displayName ? (
          <div className="site-header__account">
            <Link className="site-header__user" href="/me">
              {displayName}
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <Link className="site-header__login" href="/login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

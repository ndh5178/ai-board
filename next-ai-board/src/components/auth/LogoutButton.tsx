export function LogoutButton() {
  return (
    <form action="/api/auth/logout" className="site-header__logout-form" method="post">
      <button className="site-header__logout" type="submit">
        로그아웃
      </button>
    </form>
  );
}

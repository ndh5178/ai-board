type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";

  return (
    <form className="auth-form">
      {isLogin ? null : (
        <label>
          이름
          <input name="name" placeholder="이름" />
        </label>
      )}
      <label>
        이메일
        <input name="email" placeholder="you@example.com" type="email" />
      </label>
      <label>
        비밀번호
        <input name="password" placeholder="비밀번호" type="password" />
      </label>
      <button className="button button--primary" type="button">
        {isLogin ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}

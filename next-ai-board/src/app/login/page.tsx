import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageShell } from "@/components/layout/PageShell";

export default function LoginPage() {
  return (
    <PageShell eyebrow="Account" title="로그인">
      <section className="auth-panel">
        <AuthForm mode="login" />
        <p>
          계정이 없다면 <Link href="/signup">회원가입</Link>
        </p>
      </section>
    </PageShell>
  );
}

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageShell } from "@/components/layout/PageShell";

export default function SignupPage() {
  return (
    <PageShell eyebrow="Account" title="회원가입">
      <section className="auth-panel">
        <AuthForm mode="signup" />
        <p>
          이미 계정이 있다면 <Link href="/login">로그인</Link>
        </p>
      </section>
    </PageShell>
  );
}

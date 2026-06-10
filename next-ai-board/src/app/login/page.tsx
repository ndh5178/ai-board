import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageShell } from "@/components/layout/PageShell";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const next = (await searchParams)?.next;
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <PageShell eyebrow="Account" title="로그인">
      <section className="auth-panel">
        <AuthForm mode="login" redirectTo={next} />
        <p>
          계정이 없다면 <Link href={signupHref}>회원가입</Link>
        </p>
      </section>
    </PageShell>
  );
}

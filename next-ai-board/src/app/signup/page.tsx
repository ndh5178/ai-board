import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageShell } from "@/components/layout/PageShell";

type SignupPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const next = (await searchParams)?.next;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <PageShell eyebrow="Account" title="회원가입">
      <section className="auth-panel">
        <AuthForm mode="signup" redirectTo={next} />
        <p>
          이미 계정이 있다면 <Link href={loginHref}>로그인</Link>
        </p>
      </section>
    </PageShell>
  );
}

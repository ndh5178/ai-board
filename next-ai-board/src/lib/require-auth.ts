import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireAuth(nextPath: string) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

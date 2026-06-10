import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie, getSession } from "@/lib/session";

export async function getExistingSessionUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user ? { session, user } : null;
}

export function expiredSessionResponse() {
  const response = NextResponse.json(
    { message: "로그인 정보가 만료되었습니다. 다시 로그인하세요." },
    { status: 401 },
  );
  clearSessionCookie(response);

  return response;
}

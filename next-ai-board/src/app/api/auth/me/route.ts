import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie, getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const response = NextResponse.json(
      { message: "사용자를 찾을 수 없습니다." },
      { status: 401 },
    );
    clearSessionCookie(response);

    return response;
  }

  return NextResponse.json({ user });
}

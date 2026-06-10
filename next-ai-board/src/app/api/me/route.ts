import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clearSessionCookie, getSession } from "@/lib/session";

type AccountDeleteBody = {
  password?: string;
  confirmText?: string;
};

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | AccountDeleteBody
      | null;
    const password = body?.password ?? "";
    const confirmText = body?.confirmText?.trim() ?? "";

    if (!password || confirmText !== "회원 탈퇴") {
      return NextResponse.json(
        { message: '"회원 탈퇴"를 정확히 입력하고 비밀번호를 입력하세요.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
      clearSessionCookie(response);

      return response;
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    const response = NextResponse.json({
      message: "회원 탈퇴가 완료되었습니다.",
    });
    clearSessionCookie(response);

    return response;
  } catch {
    return NextResponse.json(
      { message: "회원 탈퇴 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

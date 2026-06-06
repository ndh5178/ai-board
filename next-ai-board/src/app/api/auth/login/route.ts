import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

type LoginBody = {
  email?: string;
  password?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readLoginBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => null)) as LoginBody | null;
  }

  const formData = await request.formData();

  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

function isFormSubmit(request: Request) {
  return !(request.headers.get("content-type") ?? "").includes("application/json");
}

export async function POST(request: Request) {
  try {
    const body = await readLoginBody(request);
    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력하세요." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    setSessionCookie(response, token);

    if (isFormSubmit(request)) {
      const redirectResponse = NextResponse.redirect(new URL("/posts", request.url), 303);
      setSessionCookie(redirectResponse, token);

      return redirectResponse;
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "로그인 처리 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readSignupBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => null)) as SignupBody | null;
  }

  const formData = await request.formData();

  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

function isFormSubmit(request: Request) {
  return !(request.headers.get("content-type") ?? "").includes("application/json");
}

export async function POST(request: Request) {
  try {
    const body = await readSignupBody(request);
    const name = body?.name?.trim() ?? "";
    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";

    if (!name || !isValidEmail(email) || password.length < 8) {
      return NextResponse.json(
        { message: "이름, 이메일, 8자 이상 비밀번호를 입력하세요." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 가입된 이메일입니다." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({ user }, { status: 201 });
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
      { message: "회원가입 처리 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

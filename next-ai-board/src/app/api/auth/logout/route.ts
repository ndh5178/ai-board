import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

function isFormSubmit(request: Request) {
  return !(request.headers.get("content-type") ?? "").includes("application/json");
}

export async function POST(request: Request) {
  if (isFormSubmit(request)) {
    const response = NextResponse.redirect(new URL("/", request.url), 303);
    clearSessionCookie(response);

    return response;
  }

  const response = NextResponse.json({ message: "로그아웃되었습니다." });
  clearSessionCookie(response);

  return response;
}

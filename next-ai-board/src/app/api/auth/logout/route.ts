import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ message: "로그아웃되었습니다." });
  clearSessionCookie(response);

  return response;
}

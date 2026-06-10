import { NextResponse } from "next/server";
import { createParseError, handleMcpRequest } from "@/mcp/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);

  if (body === undefined) {
    return NextResponse.json(createParseError(), { status: 400 });
  }

  const result = await handleMcpRequest(body);

  if (!result.body) {
    return new Response(null, { status: result.status });
  }

  return NextResponse.json(result.body, { status: result.status });
}

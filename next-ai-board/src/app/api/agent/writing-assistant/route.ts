import { NextResponse } from "next/server";
import { runWritingAssistantAgent } from "@/agent/writing-assistant";
import type { AgentInput, AgentIntent } from "@/agent/types";

type AgentBody = Partial<AgentInput>;

const agentIntents: AgentIntent[] = [
  "write_post",
  "improve_post",
  "suggest_tags",
  "review_post",
];

function isAgentIntent(value: unknown): value is AgentIntent {
  return typeof value === "string" && agentIntents.includes(value as AgentIntent);
}

function normalizeBody(body: AgentBody | null): AgentInput | null {
  const title = body?.title?.trim() ?? "";
  const content = body?.content?.trim() ?? "";
  const tags = body?.tags?.trim() ?? "";
  const weatherLocation = body?.weatherLocation?.trim() ?? "";
  const intent = isAgentIntent(body?.intent) ? body.intent : "write_post";

  if (!title && !content) {
    return null;
  }

  return {
    title,
    content,
    tags,
    intent,
    weatherLocation,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AgentBody | null;
  const input = normalizeBody(body);

  if (!input) {
    return NextResponse.json(
      { message: "Agent를 실행하려면 제목이나 본문을 입력하세요." },
      { status: 400 },
    );
  }

  try {
    const result = await runWritingAssistantAgent(input);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Agent 실행 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

import { findSimilarPosts } from "@/lib/rag";
import { handleMcpRequest } from "@/mcp/server";
import type { SimilarPost } from "@/types/rag";
import {
  AGENT_MAX_STEPS,
  type AgentInput,
  type AgentResult,
  type AgentState,
  type AgentSuggestion,
  type AgentToolCall,
  type AgentToolName,
} from "./types";

type WeatherBriefing = {
  summary?: string;
  draft?: string;
  displayLocation?: string;
};

type AgentToolContext = {
  similarPosts: SimilarPost[];
  weatherBriefing: WeatherBriefing | null;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseTags(tags = "") {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function createInitialState(input: AgentInput): AgentState {
  return {
    input,
    maxSteps: AGENT_MAX_STEPS,
    currentStep: 0,
    toolCalls: [],
    notes: [],
  };
}

function canRunNextStep(state: AgentState) {
  return state.currentStep < state.maxSteps;
}

function pushToolCall(state: AgentState, toolCall: AgentToolCall) {
  state.currentStep += 1;
  state.toolCalls.push(toolCall);
}

function toolAlreadySucceeded(state: AgentState, name: AgentToolName) {
  return state.toolCalls.some(
    (toolCall) => toolCall.name === name && toolCall.status === "success",
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}

async function runSimilarPostsTool(
  state: AgentState,
  context: AgentToolContext,
) {
  if (!canRunNextStep(state) || toolAlreadySucceeded(state, "rag_similar_posts")) {
    return;
  }

  const input = {
    title: state.input.title,
    content: state.input.content,
    limit: 3,
  };

  try {
    const posts = await findSimilarPosts(input);
    context.similarPosts = posts;
    pushToolCall(state, {
      name: "rag_similar_posts",
      reason: "현재 글과 비슷한 기존 게시글을 확인해 중복과 참고 자료를 찾습니다.",
      status: "success",
      input,
      output: posts,
    });
  } catch (error) {
    pushToolCall(state, {
      name: "rag_similar_posts",
      reason: "현재 글과 비슷한 기존 게시글을 확인해 중복과 참고 자료를 찾습니다.",
      status: "failed",
      input,
      error: getErrorMessage(error),
    });
    state.notes.push("RAG 검색에 실패해도 초안 작성은 계속 진행합니다.");
  }
}

async function runWeatherTool(
  state: AgentState,
  context: AgentToolContext,
) {
  const location = state.input.weatherLocation?.trim();

  if (!location || !canRunNextStep(state) || toolAlreadySucceeded(state, "mcp_weather_current")) {
    return;
  }

  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "weather_current",
      arguments: {
        location,
      },
    },
  };

  try {
    const result = await handleMcpRequest(request);
    const body = result.body;

    if (!body || "error" in body) {
      pushToolCall(state, {
        name: "mcp_weather_current",
        reason: "사용자가 입력한 지역의 현재 날씨를 글쓰기 참고 데이터로 사용합니다.",
        status: "failed",
        input: request.params,
        error: body && "error" in body ? body.error.message : "MCP 응답이 비어 있습니다.",
      });
      state.notes.push("MCP 날씨 도구 실패로 날씨 브리핑 없이 초안을 만듭니다.");
      return;
    }

    const resultValue = body.result as {
      structuredContent?: WeatherBriefing;
    };
    const weatherBriefing = resultValue.structuredContent ?? null;
    context.weatherBriefing = weatherBriefing;
    pushToolCall(state, {
      name: "mcp_weather_current",
      reason: "사용자가 입력한 지역의 현재 날씨를 글쓰기 참고 데이터로 사용합니다.",
      status: "success",
      input: request.params,
      output: weatherBriefing,
    });
  } catch (error) {
    pushToolCall(state, {
      name: "mcp_weather_current",
      reason: "사용자가 입력한 지역의 현재 날씨를 글쓰기 참고 데이터로 사용합니다.",
      status: "failed",
      input: request.params,
      error: getErrorMessage(error),
    });
    state.notes.push("MCP 날씨 도구 실패로 날씨 브리핑 없이 초안을 만듭니다.");
  }
}

function buildDraft(input: AgentInput, context: AgentToolContext) {
  const title = normalizeText(input.title);
  const content = normalizeText(input.content);
  const lines = [
    title ? `# ${title}` : "",
    "",
    content || "아직 본문 아이디어가 짧습니다. 핵심 주장과 배경을 먼저 적어보세요.",
  ];

  if (context.weatherBriefing?.draft) {
    lines.push("", context.weatherBriefing.draft);
  }

  if (context.similarPosts.length > 0) {
    lines.push(
      "",
      "참고하면 좋은 기존 글:",
      ...context.similarPosts.map((post) => `- ${post.title}`),
    );
  }

  return lines.filter((line, index) => line || index < 2).join("\n");
}

function runDraftWriterTool(
  state: AgentState,
  context: AgentToolContext,
  suggestion: AgentSuggestion,
) {
  if (!canRunNextStep(state) || toolAlreadySucceeded(state, "draft_writer")) {
    return;
  }

  const draft = buildDraft(state.input, context);
  suggestion.draft = draft;
  pushToolCall(state, {
    name: "draft_writer",
    reason: "사용자 입력과 도구 결과를 모아 게시글 초안을 만듭니다.",
    status: "success",
    input: {
      title: state.input.title,
      content: state.input.content,
      hasWeatherBriefing: Boolean(context.weatherBriefing),
      similarPostCount: context.similarPosts.length,
    },
    output: {
      draft,
    },
  });
}

function suggestTags(input: AgentInput, context: AgentToolContext) {
  const source = `${input.title} ${input.content}`.toLowerCase();
  const tags = parseTags(input.tags);

  if (context.weatherBriefing) {
    tags.push("MCP", "날씨");
  }

  if (context.similarPosts.length > 0) {
    tags.push("RAG", "참고글");
  }

  if (source.includes("agent") || source.includes("에이전트")) {
    tags.push("Agent");
  }

  if (source.includes("ai") || source.includes("인공지능")) {
    tags.push("AI");
  }

  return unique(tags).slice(0, 5);
}

function runTagSuggesterTool(
  state: AgentState,
  context: AgentToolContext,
  suggestion: AgentSuggestion,
) {
  if (!canRunNextStep(state) || toolAlreadySucceeded(state, "tag_suggester")) {
    return;
  }

  const tags = suggestTags(state.input, context);
  suggestion.tags = tags;
  pushToolCall(state, {
    name: "tag_suggester",
    reason: "제목, 본문, 도구 결과를 바탕으로 태그 후보를 제안합니다.",
    status: "success",
    input: {
      title: state.input.title,
      content: state.input.content,
      existingTags: state.input.tags,
    },
    output: {
      tags,
    },
  });
}

function buildReviewNotes(input: AgentInput, context: AgentToolContext) {
  const notes: string[] = [];

  if (!normalizeText(input.title)) {
    notes.push("제목을 더 구체적으로 적으면 검색과 추천 품질이 좋아집니다.");
  }

  if (normalizeText(input.content).length < 80) {
    notes.push("본문이 짧습니다. 배경, 문제, 결론을 한 문단씩 추가해 보세요.");
  }

  if (context.similarPosts.length > 0) {
    notes.push("비슷한 기존 글이 있으니 중복 질문인지 확인해 보세요.");
  }

  if (context.weatherBriefing) {
    notes.push("날씨 브리핑은 자동 초안이므로 저장 전에 표현과 수치를 확인하세요.");
  }

  return notes;
}

function buildSummary(state: AgentState) {
  const successCount = state.toolCalls.filter(
    (toolCall) => toolCall.status === "success",
  ).length;
  const failedCount = state.toolCalls.filter(
    (toolCall) => toolCall.status === "failed",
  ).length;

  if (failedCount > 0) {
    return `Agent가 ${successCount}개 도구를 활용했고 ${failedCount}개 도구는 실패해 부분 결과를 만들었습니다.`;
  }

  return `Agent가 ${successCount}개 도구를 활용해 글쓰기 제안을 만들었습니다.`;
}

export async function runWritingAssistantAgent(
  input: AgentInput,
): Promise<AgentResult> {
  const state = createInitialState(input);
  const context: AgentToolContext = {
    similarPosts: [],
    weatherBriefing: null,
  };
  const suggestion: AgentSuggestion = {
    tags: [],
    reviewNotes: [],
  };

  await runSimilarPostsTool(state, context);
  await runWeatherTool(state, context);
  runDraftWriterTool(state, context, suggestion);
  runTagSuggesterTool(state, context, suggestion);
  suggestion.reviewNotes = buildReviewNotes(input, context);

  if (state.currentStep >= state.maxSteps) {
    state.notes.push("최대 실행 단계에 도달해 Agent 실행을 종료했습니다.");
  }

  return {
    summary: buildSummary(state),
    suggestion,
    state,
  };
}

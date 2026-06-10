export type AgentToolName =
  | "rag_similar_posts"
  | "mcp_weather_current"
  | "draft_writer"
  | "tag_suggester";

export type AgentIntent =
  | "write_post"
  | "improve_post"
  | "suggest_tags"
  | "review_post";

export type AgentInput = {
  title: string;
  content: string;
  tags?: string;
  intent: AgentIntent;
  weatherLocation?: string;
};

export type AgentToolStatus = "planned" | "running" | "success" | "failed";

export type AgentToolCall = {
  name: AgentToolName;
  reason: string;
  status: AgentToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
};

export type AgentState = {
  input: AgentInput;
  maxSteps: number;
  currentStep: number;
  toolCalls: AgentToolCall[];
  notes: string[];
};

export type AgentSuggestion = {
  title?: string;
  draft?: string;
  tags: string[];
  reviewNotes: string[];
};

export type AgentResult = {
  summary: string;
  suggestion: AgentSuggestion;
  state: AgentState;
};

export const AGENT_MAX_STEPS = 4;

export const AGENT_TOOL_DESCRIPTIONS: Record<AgentToolName, string> = {
  rag_similar_posts: "현재 글과 비슷한 기존 게시글을 찾아 중복과 참고 자료를 확인합니다.",
  mcp_weather_current: "Open-Meteo MCP 날씨 도구를 호출해 현재 날씨 브리핑을 가져옵니다.",
  draft_writer: "입력과 도구 결과를 바탕으로 게시글 초안 문장을 제안합니다.",
  tag_suggester: "제목과 본문을 바탕으로 게시글 태그 후보를 제안합니다.",
};

export type JsonRpcId = number | string | null;

export type JsonRpcRequest = {
  id?: unknown;
  jsonrpc?: unknown;
  method?: unknown;
  params?: unknown;
};

export type ToolCallParams = {
  arguments?: unknown;
  name?: unknown;
};

export type JobSyncArguments = {
  provider?: unknown;
};

export type ResearchToolArguments = {
  limit?: unknown;
  location?: unknown;
  query?: unknown;
};

export function readJsonRpcRequest(body: JsonRpcRequest) {
  if (body.jsonrpc !== "2.0") {
    throw new Error("jsonrpc 값은 2.0이어야 합니다.");
  }

  if (typeof body.method !== "string" || !body.method) {
    throw new Error("method 값이 필요합니다.");
  }

  return {
    id: readJsonRpcId(body.id),
    method: body.method,
    params: body.params,
  };
}

export function readToolCallParams(params: unknown) {
  if (!params || typeof params !== "object") {
    throw new Error("params 값이 필요합니다.");
  }

  const toolParams = params as ToolCallParams;

  if (typeof toolParams.name !== "string" || !toolParams.name) {
    throw new Error("params.name 값이 필요합니다.");
  }

  return {
    arguments: toolParams.arguments,
    name: toolParams.name,
  };
}

export function readJobSyncArguments(value: unknown) {
  const args = value && typeof value === "object" ? (value as JobSyncArguments) : {};
  const provider =
    typeof args.provider === "string" && args.provider.trim() ? args.provider.trim().toLowerCase() : undefined;

  return {
    provider,
  };
}

export function readResearchToolArguments(value: unknown) {
  const args = value && typeof value === "object" ? (value as ResearchToolArguments) : {};
  const query = typeof args.query === "string" && args.query.trim() ? args.query.trim() : "";
  const location = typeof args.location === "string" && args.location.trim() ? args.location.trim() : undefined;
  const limit = readLimit(args.limit);

  if (!query) {
    throw new Error("검색어 query가 필요합니다.");
  }

  return {
    limit,
    location,
    query,
  };
}

function readJsonRpcId(value: unknown): JsonRpcId {
  if (typeof value === "number" || typeof value === "string" || value === null) {
    return value;
  }

  return null;
}

function readLimit(value: unknown) {
  const limit = Number(value ?? 5);

  if (!Number.isFinite(limit) || limit <= 0) {
    return 5;
  }

  return Math.min(Math.floor(limit), 10);
}

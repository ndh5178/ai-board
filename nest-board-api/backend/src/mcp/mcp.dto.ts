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

function readJsonRpcId(value: unknown): JsonRpcId {
  if (typeof value === "number" || typeof value === "string" || value === null) {
    return value;
  }

  return null;
}

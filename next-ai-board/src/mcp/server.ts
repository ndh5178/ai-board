import type {
  JsonRpcErrorCode,
  JsonRpcId,
  JsonRpcRequest,
  JsonRpcResponse,
  McpHttpResult,
  McpToolDefinition,
} from "./types";

const MCP_PROTOCOL_VERSION = "2025-06-18";

const serverInfo = {
  name: "next-ai-board-mcp",
  version: "0.1.0",
};

const tools: McpToolDefinition[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return value === null || typeof value === "string" || typeof value === "number";
}

function success(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function error(
  id: JsonRpcId,
  code: JsonRpcErrorCode,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  };
}

export function parseJsonRpcRequest(input: unknown): JsonRpcRequest | null {
  if (!isRecord(input)) {
    return null;
  }

  if (input.jsonrpc !== "2.0") {
    return null;
  }

  if (typeof input.method !== "string" || !input.method.trim()) {
    return null;
  }

  const id = "id" in input ? input.id : undefined;

  if (id !== undefined && !isJsonRpcId(id)) {
    return null;
  }

  const request: Omit<JsonRpcRequest, "id"> = {
    jsonrpc: "2.0",
    method: input.method,
    params: input.params,
  };

  if (id === undefined) {
    return request;
  }

  return {
    ...request,
    id,
  };
}

function handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
  return success(request.id ?? null, {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo,
  });
}

function handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
  return success(request.id ?? null, {
    tools,
  });
}

function handleToolsCall(request: JsonRpcRequest): JsonRpcResponse {
  const params = request.params;

  if (!isRecord(params) || typeof params.name !== "string") {
    return error(request.id ?? null, -32602, "tools/call requires a tool name.");
  }

  return error(
    request.id ?? null,
    -32601,
    `Tool not found: ${params.name}`,
  );
}

export async function handleMcpRequest(input: unknown): Promise<McpHttpResult> {
  if (Array.isArray(input)) {
    return {
      status: 400,
      body: error(null, -32600, "Batch JSON-RPC requests are not supported."),
    };
  }

  const request = parseJsonRpcRequest(input);

  if (!request) {
    return {
      status: 400,
      body: error(null, -32600, "Invalid JSON-RPC request."),
    };
  }

  const isNotification = !("id" in request);

  if (request.method === "notifications/initialized" && isNotification) {
    return {
      status: 204,
      body: null,
    };
  }

  if (isNotification) {
    return {
      status: 204,
      body: null,
    };
  }

  switch (request.method) {
    case "initialize":
      return {
        status: 200,
        body: handleInitialize(request),
      };
    case "tools/list":
      return {
        status: 200,
        body: handleToolsList(request),
      };
    case "tools/call":
      return {
        status: 200,
        body: handleToolsCall(request),
      };
    default:
      return {
        status: 200,
        body: error(
          request.id ?? null,
          -32601,
          `Method not found: ${request.method}`,
        ),
      };
  }
}

export function createParseError(): JsonRpcResponse {
  return error(null, -32700, "Parse error.");
}

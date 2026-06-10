export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

export type JsonRpcSuccessResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
};

export type JsonRpcErrorCode =
  | -32700
  | -32600
  | -32601
  | -32602
  | -32603;

export type JsonRpcErrorResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: {
    code: JsonRpcErrorCode;
    message: string;
    data?: unknown;
  };
};

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

export type McpHttpResult = {
  status: number;
  body: JsonRpcResponse | null;
};

export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

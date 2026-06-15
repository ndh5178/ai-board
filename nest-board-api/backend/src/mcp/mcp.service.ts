import { Injectable } from "@nestjs/common";
import { readJsonRpcRequest, readToolCallParams, type JsonRpcId, type JsonRpcRequest } from "./mcp.dto";

@Injectable()
export class McpService {
  async handleJsonRpc(body: JsonRpcRequest) {
    const request = this.readRequestSafely(body);

    if ("error" in request) {
      return this.errorResponse(null, -32600, request.error);
    }

    try {
      if (request.method !== "tools/call") {
        return this.errorResponse(request.id, -32601, "지원하지 않는 MCP method입니다.");
      }

      const params = readToolCallParams(request.params);

      return this.errorResponse(request.id, -32601, `아직 등록되지 않은 MCP tool입니다: ${params.name}`);
    } catch (error) {
      return this.errorResponse(
        request.id,
        -32602,
        error instanceof Error ? error.message : "MCP 요청을 처리하지 못했습니다.",
      );
    }
  }

  private readRequestSafely(body: JsonRpcRequest) {
    try {
      return readJsonRpcRequest(body);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "잘못된 JSON-RPC 요청입니다.",
      };
    }
  }

  private errorResponse(id: JsonRpcId, code: number, message: string) {
    return {
      error: {
        code,
        message,
      },
      id,
      jsonrpc: "2.0",
    };
  }
}

import { Injectable } from "@nestjs/common";
import type { JobPosting } from "@prisma/client";
import { RagService } from "../rag/rag.service";
import { readJobSyncArguments, readJsonRpcRequest, readToolCallParams, type JsonRpcId, type JsonRpcRequest } from "./mcp.dto";
import { listMockJobPostings } from "./mock-job-postings";

@Injectable()
export class McpService {
  constructor(private readonly ragService: RagService) {}

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

      if (params.name !== "job_sync") {
        return this.errorResponse(request.id, -32601, "지원하지 않는 MCP tool입니다.");
      }

      const result = await this.syncJobPostings(params.arguments);

      return {
        id: request.id,
        jsonrpc: "2.0",
        result,
      };
    } catch (error) {
      return this.errorResponse(
        request.id,
        -32602,
        error instanceof Error ? error.message : "MCP 요청을 처리하지 못했습니다.",
      );
    }
  }

  private async syncJobPostings(value: unknown) {
    const args = readJobSyncArguments(value);
    const provider = args.provider ?? process.env.JOB_PROVIDER ?? "mock";

    if (provider !== "mock") {
      throw new Error("현재 1차 구현에서는 mock 채용공고 provider만 지원합니다.");
    }

    const jobPostings = listMockJobPostings();
    const savedJobPostings: JobPosting[] = [];

    for (const jobPosting of jobPostings) {
      savedJobPostings.push(await this.ragService.upsertJobPosting(jobPosting));
    }

    const expiredResult = await this.ragService.expirePastDeadlineJobPostings();
    const activeCount = savedJobPostings.filter((jobPosting) => jobPosting.status === "ACTIVE").length;
    const expiredCount = savedJobPostings.filter((jobPosting) => jobPosting.status === "EXPIRED").length;

    return {
      activeCount,
      expiredCount,
      expiredUpdatedCount: expiredResult.count,
      provider,
      syncedCount: savedJobPostings.length,
      tool: "job_sync",
    };
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

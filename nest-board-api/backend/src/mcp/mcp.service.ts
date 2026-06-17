import { Injectable } from "@nestjs/common";
import { JobPostingsService } from "../job-postings/job-postings.service";
import type { JobSearchCriteria, JobSearchExperience } from "../job-postings/job-search.types";
import { readJsonRpcRequest, readToolCallParams, type JsonRpcId, type JsonRpcRequest } from "./mcp.dto";

@Injectable()
export class McpService {
  constructor(private readonly jobPostingsService: JobPostingsService) {}

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

      if (params.name === "search_saramin_jobs") {
        const criteria = this.readSaraminSearchCriteria(params.arguments);
        const jobs = await this.jobPostingsService.searchSaraminJobPostings(criteria);

        return this.successResponse(request.id, {
          criteria,
          jobs,
          totalCount: jobs.length,
        });
      }

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

  private successResponse(id: JsonRpcId, result: unknown) {
    return {
      id,
      jsonrpc: "2.0",
      result,
    };
  }

  private readSaraminSearchCriteria(value: unknown): JobSearchCriteria {
    const args = this.readRecord(value);
    const keyword = this.readString(args.keyword) || "개발자 신입";
    const roles = this.readStringArray(args.roles);
    const skills = this.readStringArray(args.skills);
    const location = this.readString(args.location) || "서울";
    const experience = this.readExperience(args.experience);

    return {
      experience,
      keyword,
      limit: 3,
      location,
      roles: roles.length > 0 ? roles : ["개발자"],
      skills,
    };
  }

  private readRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private readStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  private readExperience(value: unknown): JobSearchExperience {
    const rawValue = this.readString(value);

    if (rawValue === "신입" || rawValue === "주니어" || rawValue === "경력" || rawValue === "무관") {
      return rawValue;
    }

    return "신입";
  }
}

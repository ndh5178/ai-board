import type { ApiResult } from "../types/api";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  { body, method = "GET", signal }: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      method,
      signal,
    });

    const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : undefined;

    if (!response.ok) {
      return {
        message: errorMessage ?? `API 요청에 실패했습니다. (${response.status})`,
        ok: false,
        status: response.status,
      };
    }

    return {
      data: payload as T,
      ok: true,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        message: "API 요청이 취소되었습니다.",
        ok: false,
      };
    }

    return {
      message: "NestJS API 서버에 연결할 수 없습니다.",
      ok: false,
    };
  }
}

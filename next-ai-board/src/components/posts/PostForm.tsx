"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { SimilarPost } from "@/types/rag";
import type { AgentResult } from "@/agent/types";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  title?: string;
  content?: string;
  tags?: string;
};

type WeatherBriefing = {
  displayLocation: string;
  summary: string;
  draft: string;
};

type McpToolCallResponse = {
  result?: {
    structuredContent?: WeatherBriefing;
  };
  error?: {
    message?: string;
  };
};

export function PostForm({
  mode,
  postId,
  title = "",
  content = "",
  tags = "",
}: PostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [mcpMessage, setMcpMessage] = useState("");
  const [agentMessage, setAgentMessage] = useState("");
  const [weatherLocation, setWeatherLocation] = useState("Seoul");
  const [weatherBriefing, setWeatherBriefing] =
    useState<WeatherBriefing | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [similarPosts, setSimilarPosts] = useState<SimilarPost[]>([]);
  const [isFindingSimilarPosts, setIsFindingSimilarPosts] = useState(false);

  function getPayload(form: HTMLFormElement) {
    const formData = new FormData(form);

    return {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      tags: String(formData.get("tags") ?? ""),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const payload = getPayload(event.currentTarget);
    const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "게시글을 저장하지 못했습니다.");
        return;
      }

      router.push(`/posts/${result?.id ?? postId}`);
      router.refresh();
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function appendDraftToContent(draft: string) {
    if (!contentRef.current) {
      return;
    }

    const currentContent = contentRef.current.value.trimEnd();
    contentRef.current.value = currentContent
      ? `${currentContent}\n\n${draft}`
      : draft;
  }

  function applyAgentTags(tags: string[]) {
    if (!tagsRef.current) {
      return;
    }

    const currentTags = tagsRef.current.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const mergedTags = Array.from(new Set([...currentTags, ...tags]));
    tagsRef.current.value = mergedTags.join(", ");
    setAgentMessage("Agent 추천 태그를 태그 입력칸에 반영했습니다.");
  }

  async function handleRunAgent() {
    if (!formRef.current) {
      return;
    }

    setMessage("");
    setAgentMessage("");
    setIsRunningAgent(true);

    const payload = getPayload(formRef.current);

    try {
      const response = await fetch("/api/agent/writing-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          tags: payload.tags,
          intent: mode === "create" ? "write_post" : "improve_post",
          weatherLocation,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | (AgentResult & { message?: string })
        | null;

      if (!response.ok) {
        setAgentMessage(result?.message ?? "Agent 실행에 실패했습니다.");
        return;
      }

      setAgentResult(result);
      setAgentMessage("Agent 제안을 만들었습니다.");
    } catch {
      setAgentMessage("서버와 연결하지 못했습니다. 개발 서버 상태를 확인하세요.");
    } finally {
      setIsRunningAgent(false);
    }
  }

  async function handleLoadWeatherBriefing() {
    setMessage("");
    setMcpMessage("");
    setIsLoadingWeather(true);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: "weather_current",
            arguments: {
              location: weatherLocation,
            },
          },
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | McpToolCallResponse
        | null;

      if (!response.ok || result?.error) {
        setMcpMessage(
          result?.error?.message ?? "날씨 브리핑을 불러오지 못했습니다.",
        );
        return;
      }

      const briefing = result?.result?.structuredContent;

      if (!briefing?.draft) {
        setMcpMessage("날씨 브리핑 응답 형식이 올바르지 않습니다.");
        return;
      }

      setWeatherBriefing(briefing);
      appendDraftToContent(briefing.draft);
      setMcpMessage("날씨 브리핑을 본문에 추가했습니다.");
    } catch {
      setMcpMessage("서버와 연결하지 못했습니다. 개발 서버 상태를 확인하세요.");
    } finally {
      setIsLoadingWeather(false);
    }
  }

  async function handleFindSimilarPosts() {
    if (!formRef.current) {
      return;
    }

    setMessage("");
    setIsFindingSimilarPosts(true);

    const payload = getPayload(formRef.current);

    try {
      const response = await fetch("/api/rag/similar-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          excludePostId: postId,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        posts?: SimilarPost[];
      } | null;

      if (!response.ok) {
        setMessage(result?.message ?? "유사 게시글을 찾지 못했습니다.");
        return;
      }

      setSimilarPosts(result?.posts ?? []);
    } catch {
      setMessage("서버와 연결하지 못했습니다. 개발 서버와 DB 상태를 확인하세요.");
    } finally {
      setIsFindingSimilarPosts(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit} ref={formRef}>
      <label>
        제목
        <input
          name="title"
          placeholder="제목을 입력하세요"
          defaultValue={title}
          required
        />
      </label>
      <label>
        본문
        <textarea
          ref={contentRef}
          name="content"
          placeholder="내용을 입력하세요"
          defaultValue={content}
          required
          rows={10}
        />
      </label>
      <label>
        태그
        <input
          ref={tagsRef}
          name="tags"
          placeholder="예: RAG, MCP, Agent"
          defaultValue={tags}
        />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <section className="rag-preview agent-preview" aria-label="Agent 글쓰기 보조">
        <div className="rag-preview__header">
          <div>
            <strong>Agent 글쓰기 도우미</strong>
            <p>RAG와 MCP 도구 결과를 모아 초안, 태그, 검토 의견을 제안합니다.</p>
          </div>
          <button
            className="button button--secondary"
            disabled={isRunningAgent}
            onClick={handleRunAgent}
            type="button"
          >
            {isRunningAgent ? "실행 중" : "Agent 실행"}
          </button>
        </div>
        {agentMessage ? <p className="form-message">{agentMessage}</p> : null}
        {agentResult ? (
          <div className="agent-preview__result">
            <div>
              <strong>실행 요약</strong>
              <p>{agentResult.summary}</p>
            </div>
            {agentResult.suggestion.draft ? (
              <div>
                <strong>초안 제안</strong>
                <pre>{agentResult.suggestion.draft}</pre>
                <button
                  className="button button--secondary"
                  onClick={() =>
                    appendDraftToContent(agentResult.suggestion.draft ?? "")
                  }
                  type="button"
                >
                  본문에 추가
                </button>
              </div>
            ) : null}
            {agentResult.suggestion.tags.length > 0 ? (
              <div>
                <strong>태그 제안</strong>
                <div className="agent-preview__tags">
                  {agentResult.suggestion.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <button
                  className="button button--secondary"
                  onClick={() => applyAgentTags(agentResult.suggestion.tags)}
                  type="button"
                >
                  태그에 반영
                </button>
              </div>
            ) : null}
            {agentResult.suggestion.reviewNotes.length > 0 ? (
              <div>
                <strong>검토 의견</strong>
                <ul>
                  {agentResult.suggestion.reviewNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <strong>실행 도구</strong>
              <ul>
                {agentResult.state.toolCalls.map((toolCall, index) => (
                  <li key={`${toolCall.name}-${index}`}>
                    {toolCall.name} · {toolCall.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="rag-preview__empty">
            제목이나 본문을 입력하고 실행하면 Agent 제안이 여기에 표시됩니다.
          </p>
        )}
      </section>
      <section className="rag-preview mcp-preview" aria-label="MCP 날씨 브리핑">
        <div className="rag-preview__header">
          <div>
            <strong>날씨 브리핑 불러오기</strong>
            <p>Open-Meteo MCP 도구로 현재 날씨를 가져와 본문 초안에 추가합니다.</p>
          </div>
          <button
            className="button button--secondary"
            disabled={isLoadingWeather}
            onClick={handleLoadWeatherBriefing}
            type="button"
          >
            {isLoadingWeather ? "불러오는 중" : "브리핑 추가"}
          </button>
        </div>
        <label className="mcp-preview__field">
          지역
          <input
            value={weatherLocation}
            onChange={(event) => setWeatherLocation(event.target.value)}
            placeholder="예: Seoul"
          />
        </label>
        {mcpMessage ? <p className="form-message">{mcpMessage}</p> : null}
        {weatherBriefing ? (
          <div className="mcp-preview__result">
            <strong>{weatherBriefing.displayLocation}</strong>
            <p>{weatherBriefing.summary}</p>
          </div>
        ) : (
          <p className="rag-preview__empty">
            지역을 입력하고 버튼을 누르면 날씨 브리핑이 본문에 추가됩니다.
          </p>
        )}
      </section>
      <section className="rag-preview" aria-label="RAG 유사 게시글 추천">
        <div className="rag-preview__header">
          <div>
            <strong>유사 게시글 추천</strong>
            <p>현재 작성 중인 제목과 본문을 기준으로 비슷한 게시글을 찾습니다.</p>
          </div>
          <button
            className="button button--secondary"
            disabled={isFindingSimilarPosts}
            onClick={handleFindSimilarPosts}
            type="button"
          >
            {isFindingSimilarPosts ? "검색 중" : "비슷한 글 찾기"}
          </button>
        </div>
        {similarPosts.length > 0 ? (
          <ul className="rag-preview__list">
            {similarPosts.map((post) => (
              <li key={post.id}>
                <a href={`/posts/${post.id}`}>{post.title}</a>
                <span>{Math.round(post.similarity * 100)}% 유사</span>
                <p>{post.excerpt || `${post.authorName}님의 게시글`}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rag-preview__empty">
            제목이나 본문을 입력하고 버튼을 누르면 추천 결과가 여기에 표시됩니다.
          </p>
        )}
      </section>
      <div className="form-panel__actions">
        <button className="button button--primary" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중"
            : mode === "create"
              ? "게시글 등록"
              : "수정 완료"}
        </button>
      </div>
    </form>
  );
}

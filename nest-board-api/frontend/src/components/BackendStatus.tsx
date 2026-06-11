import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/client";
import { getHealthStatus } from "../api/health";
import type { HealthResponse } from "../types/api";

type BackendState =
  | {
      status: "checking";
    }
  | {
      message: string;
      status: "offline";
    }
  | {
      data: HealthResponse;
      status: "online";
    };

export function BackendStatus() {
  const [backendState, setBackendState] = useState<BackendState>({
    status: "checking",
  });

  useEffect(() => {
    const controller = new AbortController();

    getHealthStatus(controller.signal).then((result) => {
      if (result.ok) {
        setBackendState({ data: result.data, status: "online" });
        return;
      }

      setBackendState({ message: result.message, status: "offline" });
    });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="api-status">
      <div>
        <p className="eyebrow">API Connection</p>
        <h2>NestJS 백엔드 연결 상태</h2>
        <p>
          React 프론트엔드는 <strong>{API_BASE_URL}</strong> 주소의 NestJS API를 호출하도록 준비되어 있습니다.
        </p>
      </div>
      <div className={`api-status__badge api-status__badge--${backendState.status}`}>
        {backendState.status === "checking" ? "확인 중" : null}
        {backendState.status === "offline" ? "연결 대기" : null}
        {backendState.status === "online" ? "연결 완료" : null}
      </div>
      {backendState.status === "online" ? (
        <p className="api-status__message">{backendState.data.message}</p>
      ) : null}
      {backendState.status === "offline" ? (
        <p className="api-status__message">
          {backendState.message} 백엔드 #29 작업 이후 `/health` API를 만들면 이 영역이 연결 완료로 바뀝니다.
        </p>
      ) : null}
    </section>
  );
}

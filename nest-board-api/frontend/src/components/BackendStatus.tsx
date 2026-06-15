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

  const statusText = {
    checking: "확인 중",
    offline: "준비 중",
    online: "연결 완료",
  }[backendState.status];

  return (
    <section className="api-status" aria-label="서비스 연결 상태">
      <div>
        <p className="eyebrow">SERVICE STATUS</p>
        <h2>커리어보드 서비스 상태</h2>
        <p>
          게시글, 댓글, 로그인 기능은 <strong>{API_BASE_URL}</strong> API와 연결됩니다.
          백엔드가 실행 중이면 실시간 데이터가 이 화면에 반영됩니다.
        </p>
      </div>
      <div className={`api-status__badge api-status__badge--${backendState.status}`}>{statusText}</div>
      {backendState.status === "online" ? (
        <p className="api-status__message">{backendState.data.message}</p>
      ) : null}
      {backendState.status === "offline" ? (
        <p className="api-status__message">
          지금은 프론트 화면만 확인 중입니다. 데이터 연동까지 확인하려면 MariaDB와 NestJS 백엔드를 함께 실행해 주세요.
        </p>
      ) : null}
    </section>
  );
}

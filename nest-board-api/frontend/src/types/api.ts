export type ApiResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      message: string;
      ok: false;
      status?: number;
    };

export type HealthResponse = {
  app: string;
  message: string;
  status: "ok";
  timestamp: string;
};

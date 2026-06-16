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


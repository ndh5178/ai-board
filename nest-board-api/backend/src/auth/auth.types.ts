export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

export type RequestWithUser = {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthUser;
};

export type TokenPayload = AuthUser & {
  exp: number;
  iat: number;
  sub: string;
};

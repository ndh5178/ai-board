import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser, TokenPayload } from "./auth.types";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAccessToken(user: AuthUser, secret: string, expiresInSeconds?: number) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    ...user,
    exp: now + (expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS),
    iat: now,
    sub: user.id,
  };

  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlJson(payload);
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyAccessToken(token: string, secret: string) {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

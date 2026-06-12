export type SignupBody = {
  email?: unknown;
  name?: unknown;
  password?: unknown;
};

export type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} 값이 필요합니다.`);
  }

  return value.trim();
}

export function readEmail(value: unknown) {
  const email = readRequiredString(value, "email").toLowerCase();

  if (!email.includes("@")) {
    throw new Error("올바른 email 형식이 아닙니다.");
  }

  return email;
}

export function readPassword(value: unknown) {
  const password = readRequiredString(value, "password");

  if (password.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  return password;
}

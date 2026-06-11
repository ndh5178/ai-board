import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const AUTH_STORAGE_KEY = "nest-board-auth";

export type AuthUser = {
  email: string;
  name: string;
};

type AuthContextValue = {
  deleteAccount: () => void;
  login: (input: LoginInput) => void;
  logout: () => void;
  signup: (input: SignupInput) => void;
  user: AuthUser | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = LoginInput & {
  name: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawUser) {
      return;
    }

    try {
      setUser(JSON.parse(rawUser) as AuthUser);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const saveUser = (nextUser: AuthUser) => {
      setUser(nextUser);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    };

    return {
      deleteAccount: () => {
        setUser(null);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
      login: ({ email }: LoginInput) => {
        saveUser({
          email,
          name: email.split("@")[0] || "사용자",
        });
      },
      logout: () => {
        setUser(null);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      },
      signup: ({ email, name }: SignupInput) => {
        saveUser({
          email,
          name: name.trim() || email.split("@")[0] || "사용자",
        });
      },
      user,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}

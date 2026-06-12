import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest, clearAuthToken, saveAuthToken } from "../api/client";
import type { ApiResult } from "../types/api";

export type AuthUser = {
  email: string;
  id: string;
  name: string;
  role: "USER" | "ADMIN";
};

type AuthContextValue = {
  changePassword: (input: ChangePasswordInput) => Promise<ApiResult<ActionResponse>>;
  deleteAccount: () => void;
  deleteAccountFromServer: (input: DeleteAccountInput) => Promise<ApiResult<ActionResponse>>;
  isAuthLoading: boolean;
  login: (input: LoginInput) => Promise<ApiResult<AuthResponse>>;
  logout: () => void;
  signup: (input: SignupInput) => Promise<ApiResult<AuthResponse>>;
  user: AuthUser | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = LoginInput & {
  name: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  nextPassword: string;
};

type DeleteAccountInput = {
  confirmEmail: string;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type ActionResponse = {
  message: string;
  ok: true;
};

type MeResponse = {
  user: AuthUser;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const result = await apiRequest<MeResponse>("/auth/me", {
        auth: true,
      });

      if (ignore) {
        return;
      }

      if (result.ok) {
        setUser(result.data.user);
      } else {
        clearAuthToken();
        setUser(null);
      }

      setIsAuthLoading(false);
    }

    void loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const saveAuth = (authResponse: AuthResponse) => {
      saveAuthToken(authResponse.accessToken);
      setUser(authResponse.user);
    };

    return {
      changePassword: async (input) => {
        const result = await apiRequest<ActionResponse>("/auth/password", {
          auth: true,
          body: input,
          method: "PATCH",
        });

        if (result.ok) {
          clearAuthToken();
          setUser(null);
        }

        return result;
      },
      deleteAccount: () => {
        clearAuthToken();
        setUser(null);
      },
      deleteAccountFromServer: async (input) => {
        const result = await apiRequest<ActionResponse>("/auth/me", {
          auth: true,
          body: input,
          method: "DELETE",
        });

        if (result.ok) {
          clearAuthToken();
          setUser(null);
        }

        return result;
      },
      isAuthLoading,
      login: async (input) => {
        const result = await apiRequest<AuthResponse>("/auth/login", {
          body: input,
          method: "POST",
        });

        if (result.ok) {
          saveAuth(result.data);
        }

        return result;
      },
      logout: () => {
        clearAuthToken();
        setUser(null);
      },
      signup: async (input) => {
        const result = await apiRequest<AuthResponse>("/auth/signup", {
          body: input,
          method: "POST",
        });

        if (result.ok) {
          clearAuthToken();
          setUser(null);
        }

        return result;
      },
      user,
    };
  }, [isAuthLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}

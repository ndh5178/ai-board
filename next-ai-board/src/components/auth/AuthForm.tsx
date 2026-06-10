import { AuthFormClient } from "@/components/auth/AuthFormClient";

type AuthFormProps = {
  mode: "login" | "signup";
  redirectTo?: string;
};

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  return <AuthFormClient mode={mode} redirectTo={redirectTo} />;
}

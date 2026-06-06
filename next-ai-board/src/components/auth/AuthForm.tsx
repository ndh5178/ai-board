import { AuthFormClient } from "@/components/auth/AuthFormClient";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  return <AuthFormClient mode={mode} />;
}

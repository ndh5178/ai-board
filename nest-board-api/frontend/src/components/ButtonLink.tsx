import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  children: ReactNode;
  to: string;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ children, to, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link className={`button button--${variant}`} to={to}>
      {children}
    </Link>
  );
}

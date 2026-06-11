import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ actions, children, description, eyebrow, title }: PageShellProps) {
  return (
    <main className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="page__actions">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="page">
      <section className="page__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page__actions">{actions}</div> : null}
      </section>
      {children}
    </main>
  );
}

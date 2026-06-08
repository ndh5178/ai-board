import Link from "next/link";

type TagBadgeProps = {
  active?: boolean;
  label: string;
  href?: string;
};

export function TagBadge({ active = false, label, href }: TagBadgeProps) {
  const className = active ? "tag tag--active" : "tag";

  if (href) {
    return (
      <Link className={className} href={href}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}

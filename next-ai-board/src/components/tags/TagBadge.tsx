import Link from "next/link";

type TagBadgeProps = {
  label: string;
  href?: string;
};

export function TagBadge({ label, href }: TagBadgeProps) {
  if (href) {
    return (
      <Link className="tag" href={href}>
        {label}
      </Link>
    );
  }

  return <span className="tag">{label}</span>;
}

type TagBadgeProps = {
  label: string;
};

export function TagBadge({ label }: TagBadgeProps) {
  return <span className="tag">{label}</span>;
}

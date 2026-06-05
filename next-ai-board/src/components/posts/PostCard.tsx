import Link from "next/link";
import type { PostSummary } from "@/types/post";
import { TagBadge } from "@/components/tags/TagBadge";

type PostCardProps = {
  post: PostSummary;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card__body">
        <Link href={`/posts/${post.id}`}>
          <h2>{post.title}</h2>
        </Link>
        <p>{post.excerpt}</p>
        <div className="tag-row">
          {post.tags.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
      </div>
      <dl className="post-card__meta">
        <div>
          <dt>작성자</dt>
          <dd>{post.authorName}</dd>
        </div>
        <div>
          <dt>댓글</dt>
          <dd>{post.commentCount}</dd>
        </div>
        <div>
          <dt>작성일</dt>
          <dd>{post.createdAt}</dd>
        </div>
      </dl>
    </article>
  );
}

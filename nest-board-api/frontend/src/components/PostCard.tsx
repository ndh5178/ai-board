import { Link } from "react-router-dom";
import type { PostSummary } from "../types/post";

type PostCardProps = {
  post: PostSummary;
  rank?: number;
};

export function PostCard({ post, rank }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card__badge">
        {rank ? <span>{rank}</span> : null}
        <strong>Pick</strong>
      </div>
      <div className="post-card__body">
        <Link to={`/posts/${post.id}`}>
          <h2>{post.title}</h2>
        </Link>
        <p className="post-card__venue">{post.authorName}</p>
        <p className="post-card__period">{post.createdAt}</p>
        <p>{post.excerpt}</p>
        <div className="tag-row">
          {post.tags.map((tag) => (
            <Link className="tag" key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`}>
              {tag}
            </Link>
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

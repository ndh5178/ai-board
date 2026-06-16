import type { PostSummary } from "../types/post";
import { PostCard } from "./PostCard";

type PostListProps = {
  detailState?: {
    returnTo: string;
  };
  posts: PostSummary[];
};

export function PostList({ detailState, posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <section className="empty-state">
        <h2>게시글이 없습니다</h2>
        <p>첫 게시글을 작성하면 이곳에 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      {posts.map((post, index) => (
        <PostCard detailState={detailState} key={post.id} post={post} rank={index + 1} />
      ))}
    </section>
  );
}

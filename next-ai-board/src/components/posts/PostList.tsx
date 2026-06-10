import type { PostSummary } from "@/types/post";
import { PostCard } from "@/components/posts/PostCard";

type PostListProps = {
  emptyMessage?: string;
  emptyTitle?: string;
  posts: PostSummary[];
};

export function PostList({
  emptyMessage = "첫 게시글을 작성하면 이곳에 목록이 표시됩니다.",
  emptyTitle = "아직 게시글이 없습니다",
  posts,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <section className="empty-state" aria-label="게시글 없음">
        <h2>{emptyTitle}</h2>
        <p>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="stack" aria-label="게시글 목록">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} rank={index + 1} />
      ))}
    </section>
  );
}

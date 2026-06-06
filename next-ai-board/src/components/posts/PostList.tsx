import type { PostSummary } from "@/types/post";
import { PostCard } from "@/components/posts/PostCard";

type PostListProps = {
  posts: PostSummary[];
};

export function PostList({ posts }: PostListProps) {
  return (
    <section className="stack" aria-label="게시글 목록">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} rank={index + 1} />
      ))}
    </section>
  );
}

import { PageShell } from "../components/PageShell";
import { PostList } from "../components/PostList";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function MyPostsPage() {
  const { user } = useAuth();
  const { posts } = usePosts();
  const myPosts = posts.filter((post) => post.authorEmail === user?.email);

  return (
    <PageShell description="내가 작성한 게시글을 모아서 확인합니다." eyebrow="My" title="내가 쓴 글">
      <PostList posts={myPosts} />
    </PageShell>
  );
}

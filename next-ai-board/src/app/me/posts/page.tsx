import { PageShell } from "@/components/layout/PageShell";
import { PostList } from "@/components/posts/PostList";
import { listMyPosts } from "@/lib/my-page";
import { requireAuth } from "@/lib/require-auth";

export default async function MyPostsPage() {
  const session = await requireAuth("/me/posts");
  const posts = await listMyPosts(session.userId);

  return (
    <PageShell
      description="내가 작성한 게시글을 모아서 확인합니다."
      eyebrow="My"
      title="내가 쓴 글"
    >
      <PostList
        emptyMessage="글쓰기 페이지에서 첫 게시글을 작성해 보세요."
        emptyTitle="아직 작성한 게시글이 없습니다"
        posts={posts}
      />
    </PageShell>
  );
}

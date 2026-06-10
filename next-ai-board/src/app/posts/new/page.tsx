import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/posts/PostForm";
import { requireAuth } from "@/lib/require-auth";

export default async function NewPostPage() {
  await requireAuth("/posts/new");

  return (
    <PageShell
      eyebrow="Write"
      title="게시글 작성"
      description="제목, 본문, 태그를 입력해 새 게시글을 등록합니다."
    >
      <PostForm mode="create" />
    </PageShell>
  );
}

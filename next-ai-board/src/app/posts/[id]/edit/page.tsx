import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/posts/PostForm";
import { findPostById } from "@/lib/mock-posts";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = findPostById(id);

  return (
    <PageShell
      eyebrow="Edit"
      title="게시글 수정"
      description="게시글 내용을 수정합니다."
    >
      <PostForm
        mode="edit"
        title={post.title}
        content={post.content}
        tags={post.tags.join(", ")}
      />
    </PageShell>
  );
}

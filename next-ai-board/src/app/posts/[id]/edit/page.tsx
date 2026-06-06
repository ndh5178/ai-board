import { PageShell } from "@/components/layout/PageShell";
import { PostForm } from "@/components/posts/PostForm";
import { getPostById } from "@/lib/posts";
import { requireAuth } from "@/lib/require-auth";
import { notFound, redirect } from "next/navigation";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const [session, post] = await Promise.all([
    requireAuth(`/posts/${id}/edit`),
    getPostById(id),
  ]);

  if (!post) {
    notFound();
  }

  if (post.authorId !== session.userId && session.role !== "ADMIN") {
    redirect(`/posts/${id}`);
  }

  return (
    <PageShell
      eyebrow="Edit"
      title="게시글 수정"
      description="게시글 내용을 수정합니다."
    >
      <PostForm
        mode="edit"
        postId={post.id}
        title={post.title}
        content={post.content}
        tags={post.tags.join(", ")}
      />
    </PageShell>
  );
}

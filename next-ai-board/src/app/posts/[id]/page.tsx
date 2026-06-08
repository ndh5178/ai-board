import { ButtonLink } from "@/components/ui/ButtonLink";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { PageShell } from "@/components/layout/PageShell";
import { DeletePostButton } from "@/components/posts/DeletePostButton";
import { TagBadge } from "@/components/tags/TagBadge";
import { listCommentsByPostId } from "@/lib/comments";
import { getPostById } from "@/lib/posts";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const session = await getSession();
  const [post, comments] = await Promise.all([
    getPostById(id),
    listCommentsByPostId(id, session?.userId, session?.role),
  ]);

  if (!post) {
    notFound();
  }

  const canManagePost =
    session?.userId === post.authorId || session?.role === "ADMIN";

  return (
    <PageShell
      eyebrow="Post"
      title={post.title}
      description={`${post.authorName} · ${post.createdAt}`}
      actions={
        canManagePost ? (
          <>
            <ButtonLink href={`/posts/${post.id}/edit`} variant="secondary">
              수정
            </ButtonLink>
            <DeletePostButton postId={post.id} />
          </>
        ) : null
      }
    >
      <article className="detail-panel">
        <div className="tag-row">
          {post.tags.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
        <p>{post.content}</p>
      </article>
      <section className="section">
        <div className="section__header">
          <h2>댓글</h2>
          <span>{comments.length}</span>
        </div>
        <CommentForm postId={post.id} isLoggedIn={Boolean(session)} />
        <CommentList comments={comments} />
      </section>
    </PageShell>
  );
}

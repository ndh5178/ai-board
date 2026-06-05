import { ButtonLink } from "@/components/ui/ButtonLink";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { PageShell } from "@/components/layout/PageShell";
import { TagBadge } from "@/components/tags/TagBadge";
import { findPostById, mockComments } from "@/lib/mock-posts";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const post = findPostById(id);

  return (
    <PageShell
      eyebrow="Post"
      title={post.title}
      description={`${post.authorName} · ${post.createdAt}`}
      actions={<ButtonLink href={`/posts/${post.id}/edit`} variant="secondary">수정</ButtonLink>}
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
          <span>{mockComments.length}</span>
        </div>
        <CommentForm />
        <CommentList comments={mockComments} />
      </section>
    </PageShell>
  );
}

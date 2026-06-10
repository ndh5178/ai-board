import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { DeletePostButton } from "@/components/posts/DeletePostButton";
import { TagBadge } from "@/components/tags/TagBadge";
import { listCommentsByPostId } from "@/lib/comments";
import { getAdjacentPostsById, getPostById } from "@/lib/posts";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function renderPostContent(content: string) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return <p>게시글 내용이 없습니다.</p>;
  }

  return blocks.map((block, index) => {
    if (block.startsWith(">")) {
      return (
        <blockquote key={`${index}-${block.slice(0, 12)}`}>
          {block.replace(/^>\s?/gm, "")}
        </blockquote>
      );
    }

    if (block.startsWith("## ")) {
      return <h2 key={`${index}-${block.slice(0, 12)}`}>{block.slice(3)}</h2>;
    }

    return <p key={`${index}-${block.slice(0, 12)}`}>{block}</p>;
  });
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const session = await getSession();
  const [post, comments, adjacentPosts] = await Promise.all([
    getPostById(id),
    listCommentsByPostId(id, session?.userId, session?.role),
    getAdjacentPostsById(id),
  ]);

  if (!post) {
    notFound();
  }

  const canManagePost =
    session?.userId === post.authorId || session?.role === "ADMIN";

  return (
    <main className="page post-detail-page">
      <article className="post-detail">
        <header className="post-detail__header">
          <p className="eyebrow">Post</p>
          <h1>{post.title}</h1>
          <div className="post-detail__meta">
            <strong>{post.authorName}</strong>
            <span>{post.createdAt}</span>
            <span>댓글 {comments.length}</span>
          </div>
          {post.tags.length > 0 ? (
            <div className="tag-row">
              {post.tags.map((tag) => (
                <TagBadge key={tag} label={tag} />
              ))}
            </div>
          ) : null}
          {canManagePost ? (
            <div className="post-detail__actions">
              <ButtonLink href={`/posts/${post.id}/edit`} variant="secondary">
                수정
              </ButtonLink>
              <DeletePostButton postId={post.id} />
            </div>
          ) : null}
        </header>

        <div className="post-detail__content">
          {renderPostContent(post.content)}
        </div>

        <footer className="post-detail__author">
          <div className="post-detail__avatar" aria-hidden="true">
            {post.authorName.slice(0, 1)}
          </div>
          <div>
            <strong>{post.authorName}</strong>
            <p>AI 게시판에 기록을 남긴 작성자입니다.</p>
          </div>
        </footer>

        {adjacentPosts.previousPost || adjacentPosts.nextPost ? (
          <nav className="post-detail__nav" aria-label="이전글 다음글">
            {adjacentPosts.previousPost ? (
              <Link
                className="post-detail__nav-link"
                href={`/posts/${adjacentPosts.previousPost.id}`}
              >
                <span>이전글</span>
                <strong>{adjacentPosts.previousPost.title}</strong>
                <small>{adjacentPosts.previousPost.createdAt}</small>
              </Link>
            ) : null}
            {adjacentPosts.nextPost ? (
              <Link
                className="post-detail__nav-link post-detail__nav-link--next"
                href={`/posts/${adjacentPosts.nextPost.id}`}
              >
                <span>다음글</span>
                <strong>{adjacentPosts.nextPost.title}</strong>
                <small>{adjacentPosts.nextPost.createdAt}</small>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>

      <section className="post-detail__comments">
        <div className="section__header">
          <h2>댓글</h2>
          <span>{comments.length}</span>
        </div>
        <CommentForm postId={post.id} isLoggedIn={Boolean(session)} />
        <CommentList comments={comments} />
      </section>
    </main>
  );
}

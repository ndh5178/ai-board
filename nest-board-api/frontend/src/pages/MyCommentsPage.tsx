import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function MyCommentsPage() {
  const { user } = useAuth();
  const { posts } = usePosts();
  const myComments = posts.flatMap((post) =>
    post.comments
      .filter((comment) => comment.authorEmail === user?.email)
      .map((comment) => ({
        ...comment,
        postId: post.id,
        postTitle: post.title,
      })),
  );

  return (
    <PageShell description="내가 남긴 댓글을 모아서 확인합니다." eyebrow="My" title="내 댓글">
      <section className="my-list">
        {myComments.length > 0 ? (
          myComments.map((comment) => (
            <Link className="my-list__item" key={comment.id} to={`/posts/${comment.postId}`}>
              <div>
                <h2>{comment.postTitle}</h2>
                <p>{comment.content}</p>
              </div>
              <span>{comment.createdAt}</span>
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <h2>아직 작성한 댓글이 없습니다</h2>
            <p>게시글 상세 페이지에서 첫 댓글을 작성해 보세요.</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

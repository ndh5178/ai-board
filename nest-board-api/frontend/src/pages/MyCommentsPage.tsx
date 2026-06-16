import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import { PageShell } from "../components/PageShell";
import { formatDate } from "../posts/postMapper";

type MyComment = {
  content: string;
  createdAt: string;
  id: string;
  post: {
    id: string;
    title: string;
  };
};

type MyCommentsResponse = {
  comments: MyComment[];
  totalCount: number;
};

export function MyCommentsPage() {
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchMyComments() {
      const result = await apiRequest<MyCommentsResponse>("/me/comments", {
        auth: true,
      });

      if (ignore) {
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMyComments(result.data.comments);
    }

    void fetchMyComments();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <PageShell description="내가 남긴 댓글을 모아서 확인합니다." eyebrow="My" title="내 댓글">
      {message ? <p className="form-message">{message}</p> : null}
      <section className="my-list">
        {myComments.length > 0 ? (
          myComments.map((comment) => (
            <Link className="my-list__item" key={comment.id} to={`/posts/${comment.post.id}`}>
              <div>
                <h2>{comment.post.title}</h2>
                <p>{comment.content}</p>
              </div>
              <span>{formatDate(comment.createdAt)}</span>
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

import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PostForm } from "../components/PostForm";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function EditPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchPostById, getPostById } = usePosts();
  const [message, setMessage] = useState("");
  const post = getPostById(id);

  useEffect(() => {
    let ignore = false;

    async function loadPost() {
      const result = await fetchPostById(id);

      if (!ignore && !result.ok) {
        setMessage(result.message);
      }
    }

    void loadPost();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (!post) {
    return (
      <PageShell eyebrow="Not Found" title="게시글을 찾을 수 없습니다" description="목록에서 다시 선택해 주세요.">
        {message ? <p className="form-message">{message}</p> : null}
        <Link className="button button--secondary" to="/posts">
          목록으로
        </Link>
      </PageShell>
    );
  }

  if (post.authorEmail !== user?.email) {
    return (
      <PageShell eyebrow="Forbidden" title="수정 권한이 없습니다" description="작성자만 게시글을 수정할 수 있습니다.">
        <Link className="button button--secondary" to={`/posts/${post.id}`}>
          상세로 돌아가기
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell description="왼쪽에서 수정하면 오른쪽에서 상세페이지 미리보기를 확인할 수 있습니다." eyebrow="Edit" title="게시글 수정">
      <PostForm mode="edit" post={post} />
    </PageShell>
  );
}

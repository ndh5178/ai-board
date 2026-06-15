import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { PostForm } from "../components/PostForm";

export function NewPostPage() {
  const { user } = useAuth();

  return (
    <PageShell
      description={`${user?.name}님, 왼쪽에서 작성하면 오른쪽에서 상세페이지 미리보기를 확인할 수 있습니다.`}
      eyebrow="Write"
      title="게시글 작성"
    >
      <PostForm mode="create" />
    </PageShell>
  );
}

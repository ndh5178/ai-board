import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { PostForm } from "../components/PostForm";

export function NewPostPage() {
  const { user } = useAuth();

  return (
    <PageShell
      description={`${user?.name}님, 지금은 localStorage 임시 저장소에 게시글을 저장하고 다음 단계에서 NestJS API로 교체합니다.`}
      eyebrow="Write"
      title="게시글 작성"
    >
      <PostForm mode="create" />
    </PageShell>
  );
}

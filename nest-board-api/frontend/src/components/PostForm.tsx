import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";
import type { PostSummary } from "../types/post";

type PostFormProps = {
  mode: "create" | "edit";
  post?: PostSummary;
};

export function PostForm({ mode, post }: PostFormProps) {
  const { user } = useAuth();
  const { createPost, updatePost } = usePosts();
  const navigate = useNavigate();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewTags = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const titleInput = String(formData.get("title") ?? "").trim();
    const contentInput = String(formData.get("content") ?? "").trim();
    const tagsInput = String(formData.get("tags") ?? "");

    if (!titleInput || !contentInput) {
      setMessage("제목과 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "edit" && post) {
      const result = await updatePost(post.id, { content: contentInput, tags: tagsInput, title: titleInput });
      setIsSubmitting(false);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      navigate(`/posts/${post.id}`, { replace: true });
      return;
    }

    const result = await createPost({
      authorEmail: user.email,
      authorName: user.name,
      content: contentInput,
      tags: tagsInput,
      title: titleInput,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate(`/posts/${result.data.id}`, { replace: true });
  };

  return (
    <form className="post-editor" onSubmit={handleSubmit}>
      <section className="post-editor__pane post-editor__pane--write" aria-label="게시글 작성">
        <label>
          제목
          <input
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요"
            value={title}
          />
        </label>
        <label className="post-editor__content-field">
          내용
          <textarea
            name="content"
            onChange={(event) => setContent(event.target.value)}
            placeholder="내용을 입력하세요"
            rows={18}
            value={content}
          />
        </label>
        <label>
          태그
          <input
            name="tags"
            onChange={(event) => setTags(event.target.value)}
            placeholder="React, NestJS, API"
            value={tags}
          />
        </label>
        {message ? <p className="form-message">{message}</p> : null}
        <div className="form-panel__actions post-editor__actions">
          <button className="button button--primary" disabled={isSubmitting}>
            {isSubmitting ? "저장 중" : mode === "create" ? "게시글 등록" : "수정 완료"}
          </button>
        </div>
      </section>
      <aside className="post-editor__pane post-editor__pane--preview" aria-label="게시글 미리보기">
        <div className="post-editor__preview-label">상세페이지 미리보기</div>
        <div className="post-editor__preview-frame">
          <article className="post-detail post-editor__preview-document">
            <header className="post-detail__header">
              <div className="tag-row">
                {previewTags.length > 0 ? (
                  previewTags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="tag">태그 없음</span>
                )}
              </div>
              <h1>{title.trim() || "제목이 여기에 표시됩니다"}</h1>
              <div className="post-detail__meta">
                <strong>{user?.name ?? post?.authorName ?? "작성자"}</strong>
                <span>{post?.createdAt ?? "방금 전"}</span>
                <span>댓글 {post?.commentCount ?? 0}</span>
              </div>
              <div className="post-detail__actions post-editor__preview-actions" aria-hidden="true">
                <span className="button button--secondary">목록으로</span>
                <span className="button button--primary">새 글쓰기</span>
                {mode === "edit" ? (
                  <>
                    <span className="button button--secondary">수정</span>
                    <span className="button button--danger">삭제</span>
                  </>
                ) : null}
              </div>
            </header>
            <div className="post-detail__content post-editor__preview-content">
              <p>{content.trim() || "본문을 입력하면 실제 게시글 상세페이지처럼 이곳에 미리 표시됩니다."}</p>
            </div>
          </article>
        </div>
      </aside>
    </form>
  );
}

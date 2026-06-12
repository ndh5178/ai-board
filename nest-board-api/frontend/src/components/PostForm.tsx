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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const tags = String(formData.get("tags") ?? "");

    if (!title || !content) {
      setMessage("제목과 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "edit" && post) {
      const result = await updatePost(post.id, { content, tags, title });
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
      content,
      tags,
      title,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate(`/posts/${result.data.id}`, { replace: true });
  };

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label>
        제목
        <input defaultValue={post?.title} name="title" placeholder="제목을 입력하세요" />
      </label>
      <label>
        내용
        <textarea defaultValue={post?.content} name="content" placeholder="내용을 입력하세요" rows={10} />
      </label>
      <label>
        태그
        <input defaultValue={post?.tags.join(", ")} name="tags" placeholder="React, NestJS, API" />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <div className="form-panel__actions">
        <button className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? "저장 중" : mode === "create" ? "게시글 등록" : "수정 완료"}
        </button>
      </div>
    </form>
  );
}

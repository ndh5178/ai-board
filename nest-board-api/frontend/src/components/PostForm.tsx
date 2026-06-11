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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    if (mode === "edit" && post) {
      updatePost(post.id, { content, tags, title });
      navigate(`/posts/${post.id}`, { replace: true });
      return;
    }

    const postId = createPost({
      authorEmail: user.email,
      authorName: user.name,
      content,
      tags,
      title,
    });

    navigate(`/posts/${postId}`, { replace: true });
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
        <button className="button button--primary">
          {mode === "create" ? "게시글 등록" : "수정 완료"}
        </button>
      </div>
    </form>
  );
}

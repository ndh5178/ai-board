type PostFormProps = {
  mode: "create" | "edit";
  title?: string;
  content?: string;
  tags?: string;
};

export function PostForm({
  mode,
  title = "",
  content = "",
  tags = "",
}: PostFormProps) {
  return (
    <form className="form-panel">
      <label>
        제목
        <input name="title" placeholder="제목을 입력하세요" defaultValue={title} />
      </label>
      <label>
        본문
        <textarea
          name="content"
          placeholder="내용을 입력하세요"
          defaultValue={content}
          rows={10}
        />
      </label>
      <label>
        태그
        <input name="tags" placeholder="예: RAG, MCP, Agent" defaultValue={tags} />
      </label>
      <div className="form-panel__actions">
        <button className="button button--primary" type="button">
          {mode === "create" ? "게시글 등록" : "수정 완료"}
        </button>
      </div>
    </form>
  );
}

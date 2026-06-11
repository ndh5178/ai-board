import { PageShell } from "../components/PageShell";

export function NewPostPage() {
  return (
    <PageShell
      description="지금은 화면 구조만 만들고, 다음 단계에서 NestJS 게시글 생성 API와 연결합니다."
      eyebrow="Write"
      title="게시글 작성"
    >
      <form className="form-panel">
        <label>
          제목
          <input name="title" placeholder="제목을 입력하세요" />
        </label>
        <label>
          내용
          <textarea name="content" placeholder="내용을 입력하세요" rows={10} />
        </label>
        <label>
          태그
          <input name="tags" placeholder="React, NestJS, API" />
        </label>
        <div className="form-panel__actions">
          <button className="button button--primary" type="button">
            게시글 등록
          </button>
        </div>
      </form>
    </PageShell>
  );
}

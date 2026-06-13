import { Link } from "react-router-dom";
import { useState } from "react";
import { apiRequest } from "../api/client";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

type WritingStyleResponse = {
  analysis: {
    advice: string[];
    commentCount: number;
    interestTags: Array<{
      count: number;
      name: string;
    }>;
    postCount: number;
    profile: string;
    questionRatio: number;
    summary: string;
    technicalRatio: number;
    topKeywords: Array<{
      count: number;
      word: string;
    }>;
    totalCharacters: number;
    totalTextCount: number;
  };
};

export function MyPage() {
  const { user } = useAuth();
  const { posts } = usePosts();
  const [writingStyle, setWritingStyle] = useState<WritingStyleResponse["analysis"] | null>(null);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const myPosts = posts.filter((post) => post.authorEmail === user?.email);
  const myComments = posts.flatMap((post) => post.comments).filter((comment) => comment.authorEmail === user?.email);
  const handleAnalyzeWritingStyle = async () => {
    setIsAnalyzing(true);
    setMessage("");
    const result = await apiRequest<WritingStyleResponse>("/ai/me/writing-style", {
      auth: true,
    });
    setIsAnalyzing(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setWritingStyle(result.data.analysis);
  };

  return (
    <PageShell
      description="로그인한 사용자의 계정 정보와 활동 요약을 확인하는 공간입니다."
      eyebrow="My"
      title="내 정보"
    >
      <section className="detail-panel">
        <h2>{user?.name}</h2>
        <p>이름: {user?.name}</p>
        <p>이메일: {user?.email}</p>
        <p>권한: USER</p>
      </section>
      <section className="my-dashboard" aria-label="내 활동 요약">
        <div>
          <strong>{myPosts.length}</strong>
          <span>내가 쓴 글</span>
        </div>
        <div>
          <strong>{myComments.length}</strong>
          <span>내 댓글</span>
        </div>
      </section>
      <section className="section">
        <div className="section__header">
          <h2>내 글 스타일 분석</h2>
          <span className="section__badge">AI</span>
        </div>
        <div className="writing-style">
          <div className="writing-style__intro">
            <p>내가 작성한 게시글과 댓글을 바탕으로 글쓰기 습관과 학습 패턴을 분석합니다.</p>
            <button className="button button--primary" disabled={isAnalyzing} onClick={() => void handleAnalyzeWritingStyle()} type="button">
              {isAnalyzing ? "분석 중" : "내 글 스타일 알아보기"}
            </button>
          </div>
          {message ? <p className="form-message">{message}</p> : null}
          {writingStyle ? (
            <div className="writing-style__result">
              <article className="writing-style__summary">
                <span>스타일 요약</span>
                <h3>{writingStyle.profile}</h3>
                <p>{writingStyle.summary}</p>
              </article>
              <div className="writing-style__metrics">
                <div>
                  <strong>{writingStyle.postCount}</strong>
                  <span>분석한 글</span>
                </div>
                <div>
                  <strong>{writingStyle.commentCount}</strong>
                  <span>분석한 댓글</span>
                </div>
                <div>
                  <strong>{Math.round(writingStyle.questionRatio * 100)}%</strong>
                  <span>질문형 비율</span>
                </div>
                <div>
                  <strong>{Math.round(writingStyle.technicalRatio * 100)}%</strong>
                  <span>기술 키워드 비율</span>
                </div>
              </div>
              <div className="writing-style__columns">
                <div>
                  <h3>자주 쓰는 단어</h3>
                  {writingStyle.topKeywords.length > 0 ? (
                    <div className="tag-row">
                      {writingStyle.topKeywords.map((keyword) => (
                        <span className="tag" key={keyword.word}>
                          {keyword.word} {keyword.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>아직 반복 단어가 충분하지 않습니다.</p>
                  )}
                </div>
                <div>
                  <h3>관심 태그</h3>
                  {writingStyle.interestTags.length > 0 ? (
                    <div className="tag-row">
                      {writingStyle.interestTags.map((tag) => (
                        <span className="tag" key={tag.name}>
                          #{tag.name} {tag.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>아직 사용한 태그가 없습니다.</p>
                  )}
                </div>
              </div>
              <div className="writing-style__advice">
                <h3>다음 글을 더 좋게 쓰는 방법</h3>
                <ul>
                  {writingStyle.advice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="section">
        <div className="section__header">
          <h2>바로가기</h2>
        </div>
        <div className="my-actions">
          <Link className="button button--secondary" to="/posts/new">
            글쓰기
          </Link>
          <Link className="button button--secondary" to="/me/posts">
            내가 쓴 글 보기
          </Link>
          <Link className="button button--secondary" to="/me/comments">
            내 댓글 보기
          </Link>
          <Link className="button button--secondary" to="/settings">
            설정 보기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

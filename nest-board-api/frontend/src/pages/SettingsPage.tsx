import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageShell } from "../components/PageShell";
import { usePosts } from "../posts/PostContext";

type JobSyncTarget = "saramin" | "fallback";

type JobSyncResponse = {
  fetchedCount: number;
  indexedCount: number;
  indexFailedCount?: number;
  savedCount: number;
  source: string;
};

export function SettingsPage() {
  const { changePassword, deleteAccountFromServer, user } = useAuth();
  const { deletePostsByAuthor } = usePosts();
  const navigate = useNavigate();
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [jobSyncMessage, setJobSyncMessage] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [jobSyncTarget, setJobSyncTarget] = useState<JobSyncTarget | null>(null);

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const nextPassword = String(formData.get("nextPassword") ?? "");

    if (!currentPassword || !nextPassword) {
      setPasswordMessage("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
      return;
    }

    setIsPasswordSubmitting(true);
    const result = await changePassword({
      currentPassword,
      nextPassword,
    });
    setIsPasswordSubmitting(false);

    if (!result.ok) {
      setPasswordMessage(result.message);
      return;
    }

    setPasswordMessage(result.data.message);
    event.currentTarget.reset();
    navigate("/login", {
      replace: true,
      state: {
        message: result.data.message,
      },
    });
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (email !== user.email) {
      setDeleteMessage("탈퇴 확인을 위해 현재 이메일을 정확히 입력해 주세요.");
      return;
    }

    setIsDeleteSubmitting(true);
    const result = await deleteAccountFromServer({
      confirmEmail: email,
    });
    setIsDeleteSubmitting(false);

    if (!result.ok) {
      setDeleteMessage(result.message);
      return;
    }

    deletePostsByAuthor(user.email);
    navigate("/", { replace: true });
  };

  const handleJobPostingSync = async (target: JobSyncTarget) => {
    const endpoint =
      target === "saramin" ? "/job-postings/saramin/sync" : "/job-postings/wanted-fallback/sync";
    const label = target === "saramin" ? "사람인 공고" : "Fallback 공고";

    setJobSyncTarget(target);
    setJobSyncMessage("");

    const result = await apiRequest<JobSyncResponse>(endpoint, {
      auth: true,
      method: "POST",
    });

    setJobSyncTarget(null);

    if (!result.ok) {
      setJobSyncMessage(result.message);
      return;
    }

    const indexFailedCount = result.data.indexFailedCount ?? 0;
    const failedMessage =
      indexFailedCount > 0 ? `, ${indexFailedCount}개 임베딩 실패` : "";

    setJobSyncMessage(
      `${label} ${result.data.savedCount}개 저장, ${result.data.indexedCount}개 임베딩 완료${failedMessage}`,
    );
  };

  return (
    <PageShell description="현재 계정 정보를 확인하고 비밀번호 변경, 회원 탈퇴를 관리합니다." eyebrow="My" title="설정">
      <section className="detail-panel">
        <h2>{user?.name}</h2>
        <p>이름: {user?.name}</p>
        <p>이메일: {user?.email}</p>
        <p>권한: {user?.role}</p>
      </section>
      {user?.role === "ADMIN" ? (
        <section className="settings-grid" aria-label="관리자 설정">
          <article className="settings-panel">
            <div>
              <h2>사람인 채용공고 불러오기</h2>
              <p>사람인 API 키가 있을 때 서울 개발자 채용공고를 DB와 ChromaDB에 저장합니다.</p>
            </div>
            {jobSyncMessage ? <p className="form-message">{jobSyncMessage}</p> : null}
            <button
              className="button button--primary"
              disabled={jobSyncTarget !== null}
              onClick={() => handleJobPostingSync("saramin")}
              type="button"
            >
              {jobSyncTarget === "saramin" ? "불러오는 중" : "사람인 공고 불러오기"}
            </button>
          </article>
          <article className="settings-panel">
            <div>
              <h2>Fallback 채용공고 불러오기</h2>
              <p>API 키가 없거나 외부 API가 실패할 때, 원티드 seed 공고를 DB와 ChromaDB에 저장합니다.</p>
            </div>
            <button
              className="button button--secondary"
              disabled={jobSyncTarget !== null}
              onClick={() => handleJobPostingSync("fallback")}
              type="button"
            >
              {jobSyncTarget === "fallback" ? "불러오는 중" : "Fallback 공고 불러오기"}
            </button>
          </article>
        </section>
      ) : null}
      <section className="settings-grid" aria-label="계정 설정">
        <article className="settings-panel">
          <div>
            <h2>비밀번호 변경</h2>
            <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
          </div>
          <form className="settings-form" onSubmit={handlePasswordChange}>
            <label>
              현재 비밀번호
              <input name="currentPassword" type="password" />
            </label>
            <label>
              새 비밀번호
              <input name="nextPassword" type="password" />
            </label>
            {passwordMessage ? <p className="form-message">{passwordMessage}</p> : null}
            <button className="button button--primary" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? "변경 중" : "비밀번호 변경"}
            </button>
          </form>
        </article>
        <article className="settings-panel settings-panel--danger">
          <div>
            <h2>회원 탈퇴</h2>
            <p>탈퇴하면 계정과 연결된 게시글, 댓글이 함께 삭제됩니다.</p>
          </div>
          <form className="settings-form" onSubmit={handleDeleteAccount}>
            <p className="settings-warning">탈퇴 확인을 위해 현재 이메일을 입력하세요.</p>
            <label>
              이메일
              <input name="email" placeholder={user?.email} />
            </label>
            {deleteMessage ? <p className="form-message">{deleteMessage}</p> : null}
            <button className="button button--danger" disabled={isDeleteSubmitting}>
              {isDeleteSubmitting ? "탈퇴 중" : "회원 탈퇴"}
            </button>
          </form>
        </article>
      </section>
    </PageShell>
  );
}

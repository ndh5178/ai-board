import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";
import { apiRequest } from "../api/client";

type JobSyncResponse = {
  error?: {
    code: number;
    message: string;
  };
  id: string;
  jsonrpc: "2.0";
  result?: {
    activeCount: number;
    expiredCount: number;
    expiredUpdatedCount: number;
    provider: string;
    syncedCount: number;
    tool: "job_sync";
  };
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
  const [isJobSyncSubmitting, setIsJobSyncSubmitting] = useState(false);

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

  const handleJobPostingSync = async () => {
    setIsJobSyncSubmitting(true);
    const result = await apiRequest<JobSyncResponse>("/mcp/json-rpc", {
      auth: true,
      body: {
        id: "job-sync",
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          arguments: {},
          name: "job_sync",
        },
      },
      method: "POST",
    });
    setIsJobSyncSubmitting(false);

    if (!result.ok) {
      setJobSyncMessage(result.message);
      return;
    }

    if (result.data.error) {
      setJobSyncMessage(result.data.error.message);
      return;
    }

    if (!result.data.result) {
      setJobSyncMessage("채용공고 업데이트 결과를 확인할 수 없습니다.");
      return;
    }

    setJobSyncMessage(
      `채용공고 ${result.data.result.syncedCount}개를 업데이트했습니다. provider=${result.data.result.provider}, ACTIVE ${result.data.result.activeCount}개, EXPIRED ${result.data.result.expiredCount}개`,
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
      <section className="settings-grid" aria-label="계정 설정">
        {user?.role === "ADMIN" ? (
          <article className="settings-panel">
            <div>
              <h2>채용공고 업데이트</h2>
              <p>관리자 권한으로 MCP job_sync 도구를 호출해 채용공고 데이터를 갱신합니다.</p>
            </div>
            {jobSyncMessage ? <p className="form-message">{jobSyncMessage}</p> : null}
            <button className="button button--primary" disabled={isJobSyncSubmitting} onClick={handleJobPostingSync}>
              {isJobSyncSubmitting ? "업데이트 중" : "채용공고 업데이트"}
            </button>
          </article>
        ) : null}
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

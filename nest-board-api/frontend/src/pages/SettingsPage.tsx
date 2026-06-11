import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";
import { usePosts } from "../posts/PostContext";

export function SettingsPage() {
  const { deleteAccount, user } = useAuth();
  const { deletePostsByAuthor } = usePosts();
  const navigate = useNavigate();
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const nextPassword = String(formData.get("nextPassword") ?? "");

    if (!currentPassword || !nextPassword) {
      setPasswordMessage("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
      return;
    }

    setPasswordMessage("현재는 프론트 임시 상태라 비밀번호 변경 UI만 확인합니다.");
    event.currentTarget.reset();
  };

  const handleDeleteAccount = (event: FormEvent<HTMLFormElement>) => {
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

    deletePostsByAuthor(user.email);
    deleteAccount();
    navigate("/", { replace: true });
  };

  return (
    <PageShell description="현재 계정 정보를 확인하고 비밀번호 변경, 회원 탈퇴를 관리합니다." eyebrow="My" title="설정">
      <section className="detail-panel">
        <h2>{user?.name}</h2>
        <p>이름: {user?.name}</p>
        <p>이메일: {user?.email}</p>
        <p>권한: USER</p>
      </section>
      <section className="settings-grid" aria-label="계정 설정">
        <article className="settings-panel">
          <div>
            <h2>비밀번호 변경</h2>
            <p>현재는 UI 흐름만 확인하고, 백엔드 인증 API가 생기면 실제 변경 요청으로 교체합니다.</p>
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
            <button className="button button--primary">비밀번호 변경</button>
          </form>
        </article>
        <article className="settings-panel settings-panel--danger">
          <div>
            <h2>회원 탈퇴</h2>
            <p>탈퇴하면 임시 저장소의 내 게시글과 댓글이 함께 정리됩니다.</p>
          </div>
          <form className="settings-form" onSubmit={handleDeleteAccount}>
            <p className="settings-warning">탈퇴 확인을 위해 현재 이메일을 입력하세요.</p>
            <label>
              이메일
              <input name="email" placeholder={user?.email} />
            </label>
            {deleteMessage ? <p className="form-message">{deleteMessage}</p> : null}
            <button className="button button--danger">회원 탈퇴</button>
          </form>
        </article>
      </section>
    </PageShell>
  );
}

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SiteHeader } from "./components/SiteHeader";
import { AiPage } from "./pages/AiPage";
import { EditPostPage } from "./pages/EditPostPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyCommentsPage } from "./pages/MyCommentsPage";
import { MyPage } from "./pages/MyPage";
import { MyPostsPage } from "./pages/MyPostsPage";
import { NewPostPage } from "./pages/NewPostPage";
import { NoticesPage } from "./pages/NoticesPage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { PostsPage } from "./pages/PostsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignupPage } from "./pages/SignupPage";
import { TagsPage } from "./pages/TagsPage";

export function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {isAuthPage ? null : <SiteHeader />}
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<PostsPage />} path="/posts" />
        <Route
          element={
            <ProtectedRoute>
              <NewPostPage />
            </ProtectedRoute>
          }
          path="/posts/new"
        />
        <Route element={<PostDetailPage />} path="/posts/:id" />
        <Route
          element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          }
          path="/posts/:id/edit"
        />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<NoticesPage />} path="/notices" />
        <Route element={<AiPage />} path="/ai" />
        <Route
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
          path="/me"
        />
        <Route
          element={
            <ProtectedRoute>
              <MyPostsPage />
            </ProtectedRoute>
          }
          path="/me/posts"
        />
        <Route
          element={
            <ProtectedRoute>
              <MyCommentsPage />
            </ProtectedRoute>
          }
          path="/me/comments"
        />
        <Route
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
          path="/settings"
        />
        <Route element={<SignupPage />} path="/signup" />
        <Route element={<TagsPage />} path="/tags" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </>
  );
}

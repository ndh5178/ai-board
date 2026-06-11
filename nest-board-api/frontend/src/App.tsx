import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SiteHeader } from "./components/SiteHeader";
import { EditPostPage } from "./pages/EditPostPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { NewPostPage } from "./pages/NewPostPage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { PostsPage } from "./pages/PostsPage";
import { SignupPage } from "./pages/SignupPage";
import { TagsPage } from "./pages/TagsPage";

export function App() {
  return (
    <>
      <SiteHeader />
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
        <Route
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
          path="/me"
        />
        <Route element={<SignupPage />} path="/signup" />
        <Route element={<TagsPage />} path="/tags" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </>
  );
}

import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { PageShell } from "../components/PageShell";
import { PostList } from "../components/PostList";
import { toPostSummary } from "../posts/postMapper";
import type { ApiPost, PostSummary } from "../types/post";

type MyPostsResponse = {
  posts: ApiPost[];
  totalCount: number;
};

export function MyPostsPage() {
  const [myPosts, setMyPosts] = useState<PostSummary[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchMyPosts() {
      const result = await apiRequest<MyPostsResponse>("/me/posts", {
        auth: true,
      });

      if (ignore) {
        return;
      }

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMyPosts(result.data.posts.map(toPostSummary));
    }

    void fetchMyPosts();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <PageShell description="내가 작성한 게시글을 모아서 확인합니다." eyebrow="My" title="내가 쓴 글">
      {message ? <p className="form-message">{message}</p> : null}
      <PostList detailState={{ returnTo: "/me/posts" }} posts={myPosts} />
    </PageShell>
  );
}

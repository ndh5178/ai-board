export type PostSummary = {
  authorEmail: string;
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
  tags: string[];
  accent: string;
  comments: PostComment[];
};

export type PostComment = {
  authorEmail: string;
  authorName: string;
  content: string;
  createdAt: string;
  id: string;
};

export type ApiUser = {
  email: string;
  id: string;
  name: string;
  role: "USER" | "ADMIN";
};

export type ApiTagLink = {
  tag: {
    id: string;
    name: string;
  };
};

export type ApiComment = {
  author: ApiUser;
  content: string;
  createdAt: string;
  id: string;
  postId?: string;
  updatedAt: string;
};

export type ApiPost = {
  _count: {
    comments: number;
  };
  author: ApiUser;
  comments?: ApiComment[];
  content?: string;
  createdAt: string;
  excerpt: string | null;
  id: string;
  tags: ApiTagLink[];
  title: string;
  updatedAt: string;
  viewCount: number;
};

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

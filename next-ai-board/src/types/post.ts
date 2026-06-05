export type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  commentCount: number;
  tags: string[];
  createdAt: string;
};

export type PostDetail = PostSummary & {
  content: string;
};

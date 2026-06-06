export type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  commentCount: number;
  tags: string[];
  createdAt: string;
  venue: string;
  period: string;
  badge?: string;
  accent: string;
  discount?: string;
};

export type PostDetail = PostSummary & {
  content: string;
  authorId?: string;
};

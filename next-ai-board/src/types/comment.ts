export type Comment = {
  id: string;
  authorId?: string;
  authorName: string;
  canManage?: boolean;
  content: string;
  createdAt: string;
};

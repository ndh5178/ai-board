import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Comment } from "@/types/comment";

const commentInclude = {
  author: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function mapComment(
  comment: CommentWithAuthor,
  currentUserId?: string,
  currentUserRole?: string,
): Comment {
  return {
    id: comment.id,
    authorId: comment.author.id,
    authorName: comment.author.name,
    canManage:
      comment.author.id === currentUserId || currentUserRole === "ADMIN",
    content: comment.content,
    createdAt: formatDate(comment.createdAt),
  };
}

export async function listCommentsByPostId(
  postId: string,
  currentUserId?: string,
  currentUserRole?: string,
) {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
    },
    include: commentInclude,
    orderBy: {
      createdAt: "asc",
    },
  });

  return comments.map((comment) =>
    mapComment(comment, currentUserId, currentUserRole),
  );
}

export async function getCommentOwner(commentId: string) {
  return prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      authorId: true,
      postId: true,
    },
  });
}

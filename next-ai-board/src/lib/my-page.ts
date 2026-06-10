import { prisma } from "@/lib/db";
import { mapPostSummary } from "@/lib/posts";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getMyPageSummary(userId: string) {
  const [user, postCount, commentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.post.count({
      where: { authorId: userId },
    }),
    prisma.comment.count({
      where: { authorId: userId },
    }),
  ]);

  return user
    ? {
        ...user,
        commentCount,
        createdAt: formatDate(user.createdAt),
        postCount,
      }
    : null;
}

export async function listMyPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts.map(mapPostSummary);
}

export async function listMyComments(userId: string) {
  const comments = await prisma.comment.findMany({
    where: { authorId: userId },
    include: {
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: formatDate(comment.createdAt),
    postId: comment.post.id,
    postTitle: comment.post.title,
  }));
}

import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthUser) {
    const [postCount, commentCount] = await Promise.all([
      this.prisma.post.count({
        where: {
          authorId: user.id,
        },
      }),
      this.prisma.comment.count({
        where: {
          authorId: user.id,
        },
      }),
    ]);

    return {
      summary: {
        commentCount,
        postCount,
      },
    };
  }

  async findMyPosts(user: AuthUser) {
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: this.postListSelect(),
      where: {
        authorId: user.id,
      },
    });

    return {
      posts,
      totalCount: posts.length,
    };
  }

  async findMyComments(user: AuthUser) {
    const comments = await this.prisma.comment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        content: true,
        createdAt: true,
        id: true,
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        postId: true,
        updatedAt: true,
      },
      where: {
        authorId: user.id,
      },
    });

    return {
      comments,
      totalCount: comments.length,
    };
  }

  private postListSelect() {
    return {
      _count: {
        select: {
          comments: true,
        },
      },
      author: {
        select: {
          email: true,
          id: true,
          name: true,
          role: true,
        },
      },
      createdAt: true,
      excerpt: true,
      id: true,
      status: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      title: true,
      updatedAt: true,
      viewCount: true,
    };
  }
}

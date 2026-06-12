import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { readCommentContent, type CreateCommentBody, type UpdateCommentBody } from "./comments.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postId: string, body: CreateCommentBody, user: AuthUser) {
    const content = this.readCreateInput(body);
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    const comment = await this.prisma.comment.create({
      data: {
        authorId: user.id,
        content,
        postId,
      },
      select: this.commentSelect(),
    });

    return {
      comment,
    };
  }

  async remove(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
        post: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    if (comment.authorId !== user.id && comment.post.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("댓글 작성자 또는 게시글 작성자만 삭제할 수 있습니다.");
    }

    await this.prisma.comment.delete({
      where: {
        id,
      },
    });

    return {
      id,
      ok: true,
    };
  }

  async update(id: string, body: UpdateCommentBody, user: AuthUser) {
    const content = this.readCreateInput(body);
    const comment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    if (comment.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("댓글 작성자만 수정할 수 있습니다.");
    }

    const updatedComment = await this.prisma.comment.update({
      data: {
        content,
      },
      where: {
        id,
      },
      select: this.commentSelect(),
    });

    return {
      comment: updatedComment,
    };
  }

  private readCreateInput(body: CreateCommentBody) {
    try {
      return readCommentContent(body.content);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private commentSelect() {
    return {
      author: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
      content: true,
      createdAt: true,
      id: true,
      postId: true,
      updatedAt: true,
    };
  }
}

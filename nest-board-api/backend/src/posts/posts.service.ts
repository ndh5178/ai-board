import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { AuthUser } from "../auth/auth.types";
import {
  readOptionalPostContent,
  readOptionalPostTitle,
  readPostContent,
  readPostTitle,
  type CreatePostBody,
  type UpdatePostBody,
} from "./posts.dto";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreatePostBody, user: AuthUser) {
    const input = this.readCreateInput(body);
    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        content: input.content,
        excerpt: this.buildExcerpt(input.content),
        title: input.title,
      },
      select: this.postDetailSelect(),
    });

    return {
      post,
    };
  }

  async findAll() {
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: this.postListSelect(),
    });

    return {
      posts,
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id,
      },
      select: this.postDetailSelect(),
    });

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return {
      post,
    };
  }

  async update(id: string, body: UpdatePostBody, user: AuthUser) {
    const input = this.readUpdateInput(body);
    const existingPost = await this.findPostOwner(id);

    this.assertPostAuthor(existingPost.authorId, user);

    const post = await this.prisma.post.update({
      data: {
        ...(input.content === undefined
          ? {}
          : {
              content: input.content,
              excerpt: this.buildExcerpt(input.content),
            }),
        ...(input.title === undefined
          ? {}
          : {
              title: input.title,
            }),
      },
      where: {
        id,
      },
      select: this.postDetailSelect(),
    });

    return {
      post,
    };
  }

  async remove(id: string, user: AuthUser) {
    const existingPost = await this.findPostOwner(id);

    this.assertPostAuthor(existingPost.authorId, user);

    await this.prisma.post.delete({
      where: {
        id,
      },
    });

    return {
      id,
      ok: true,
    };
  }

  private async findPostOwner(id: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return post;
  }

  private assertPostAuthor(authorId: string, user: AuthUser) {
    if (authorId !== user.id) {
      throw new ForbiddenException("게시글 작성자만 수정하거나 삭제할 수 있습니다.");
    }
  }

  private readCreateInput(body: CreatePostBody) {
    try {
      return {
        content: readPostContent(body.content),
        title: readPostTitle(body.title),
      };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private readUpdateInput(body: UpdatePostBody) {
    try {
      const input = {
        content: readOptionalPostContent(body.content),
        title: readOptionalPostTitle(body.title),
      };

      if (input.content === undefined && input.title === undefined) {
        throw new Error("수정할 title 또는 content 값이 필요합니다.");
      }

      return input;
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private buildExcerpt(content: string) {
    return content.replace(/\s+/g, " ").slice(0, 160);
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
        },
      },
      createdAt: true,
      excerpt: true,
      id: true,
      title: true,
      updatedAt: true,
      viewCount: true,
    };
  }

  private postDetailSelect() {
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
        },
      },
      content: true,
      createdAt: true,
      excerpt: true,
      id: true,
      title: true,
      updatedAt: true,
      viewCount: true,
    };
  }
}

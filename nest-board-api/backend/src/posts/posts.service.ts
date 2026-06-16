import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { RagService } from "../rag/rag.service";
import { JobRecommendationCommentService } from "./job-recommendation-comment.service";
import {
  readOptionalPostContent,
  readOptionalPostTitle,
  readOptionalTagNames,
  readPostContent,
  readPostsQuery,
  readPostTitle,
  type CreatePostBody,
  type ListPostsQuery,
  type UpdatePostBody,
} from "./posts.dto";

type PostForSideEffects = {
  author: {
    email: string;
    id: string;
    name: string;
  };
  content: string;
  excerpt: string | null;
  id: string;
  status: string;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  title: string;
};

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly jobRecommendationCommentService: JobRecommendationCommentService,
  ) {}

  async create(body: CreatePostBody, user: AuthUser) {
    const input = this.readCreateInput(body);
    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        content: input.content,
        excerpt: this.buildExcerpt(input.content),
        tags: this.buildTagCreateInput(input.tagNames),
        title: input.title,
      },
      select: this.postDetailSelect(),
    });

    void this.runPostSideEffects(post);

    return {
      post,
    };
  }

  async findAll(query: ListPostsQuery = {}) {
    const input = readPostsQuery(query);
    const where = this.buildPostWhereInput(input.q, input.tag);
    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: this.postListSelect(),
        skip: input.skip,
        take: input.pageSize,
        where,
      }),
      this.prisma.post.count({
        where,
      }),
    ]);

    return {
      page: input.page,
      pageSize: input.pageSize,
      posts,
      totalCount,
      totalPages: Math.ceil(totalCount / input.pageSize),
    };
  }

  async findAllByTag(tag: string) {
    return this.findAll({
      tag,
    });
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
        ...(input.tagNames === undefined
          ? {}
          : {
              tags: {
                deleteMany: {},
                ...this.buildTagCreateInput(input.tagNames),
              },
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

    void this.runPostSideEffects(post);

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
    await this.ragService.deletePostVector(id);

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

  private async runPostSideEffects(post: PostForSideEffects) {
    try {
      await this.ragService.upsertPostVector(post);
      await this.jobRecommendationCommentService.createForPost(post);
    } catch {
      return;
    }
  }

  private assertPostAuthor(authorId: string, user: AuthUser) {
    if (authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("게시글 작성자만 수정하거나 삭제할 수 있습니다.");
    }
  }

  private readCreateInput(body: CreatePostBody) {
    try {
      return {
        content: readPostContent(body.content),
        tagNames: readOptionalTagNames(body.tags) ?? [],
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
        tagNames: readOptionalTagNames(body.tags),
        title: readOptionalPostTitle(body.title),
      };

      if (input.content === undefined && input.tagNames === undefined && input.title === undefined) {
        throw new Error("수정할 title, content 또는 tags 값이 필요합니다.");
      }

      return input;
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "입력값을 확인해주세요.");
    }
  }

  private buildPostWhereInput(q?: string, tag?: string) {
    return {
      ...(q
        ? {
            OR: [
              {
                title: {
                  contains: q,
                },
              },
              {
                content: {
                  contains: q,
                },
              },
            ],
          }
        : {}),
      ...(tag
        ? {
            tags: {
              some: {
                tag: {
                  name: tag.toLowerCase(),
                },
              },
            },
          }
        : {}),
    };
  }

  private buildTagCreateInput(tagNames: string[]) {
    if (tagNames.length === 0) {
      return {};
    }

    return {
      create: tagNames.map((name) => ({
        tag: {
          connectOrCreate: {
            create: {
              name,
            },
            where: {
              name,
            },
          },
        },
      })),
    };
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
      comments: {
        orderBy: {
          createdAt: "asc" as const,
        },
        select: {
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
          updatedAt: true,
        },
      },
      content: true,
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

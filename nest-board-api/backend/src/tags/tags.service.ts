import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { PostsService } from "../posts/posts.service";

@Injectable()
export class TagsService {
  constructor(
    private readonly postsService: PostsService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        _count: {
          select: {
            posts: true,
          },
        },
        id: true,
        name: true,
      },
      where: {
        posts: {
          some: {},
        },
      },
    });

    return {
      tags,
    };
  }

  findPostsByTag(name: string) {
    return this.postsService.findAllByTag(name);
  }
}

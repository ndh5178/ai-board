import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ChromaVectorService } from "./chroma-vector.service";
import { readSearchPostsQuery, type SearchPostsQuery } from "./rag.dto";

const EMBEDDING_TARGET_TAG_NAME = "채용";

type PostForVector = {
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
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaVectorService: ChromaVectorService,
  ) {}

  async searchPosts(query: SearchPostsQuery = {}) {
    const input = readSearchPostsQuery(query);
    const chromaMatches = await this.searchPostsWithChroma(input.q, input.limit);

    if (chromaMatches.length > 0) {
      return this.buildSearchResponse(input.q, chromaMatches);
    }

    return {
      matches: [],
      query: input.q,
      totalCount: 0,
    };
  }

  async reindexPublishedPosts() {
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: this.postSearchSelect(),
      where: {
        status: "PUBLISHED",
        tags: {
          some: {
            tag: {
              name: EMBEDDING_TARGET_TAG_NAME,
            },
          },
        },
      },
    });

    let indexedCount = 0;

    for (const post of posts) {
      await this.upsertPostVector(post);
      indexedCount += 1;
    }

    return {
      indexedCount,
      totalCount: posts.length,
    };
  }

  async upsertPostVector(post: PostForVector) {
    try {
      if (post.status !== "PUBLISHED" || !this.shouldEmbedPost(post)) {
        await this.chromaVectorService.deletePost(post.id);
        return;
      }

      await this.chromaVectorService.upsertPost({
        authorName: post.author.name,
        content: post.content,
        id: post.id,
        status: post.status,
        tags: this.readTagNames(post.tags),
        title: post.title,
      });
    } catch {
      return;
    }
  }

  async deletePostVector(id: string) {
    try {
      await this.chromaVectorService.deletePost(id);
    } catch {
      return;
    }
  }

  private async searchPostsWithChroma(query: string, limit: number) {
    try {
      return await this.chromaVectorService.searchPosts(query, limit);
    } catch {
      return [];
    }
  }

  private async buildSearchResponse(query: string, vectorMatches: Array<{ id: string; score: number }>) {
    const posts = await this.prisma.post.findMany({
      select: this.postSearchSelect(),
      where: {
        id: {
          in: vectorMatches.map((match) => match.id),
        },
        status: "PUBLISHED",
        tags: {
          some: {
            tag: {
              name: EMBEDDING_TARGET_TAG_NAME,
            },
          },
        },
      },
    });
    const postById = new Map(posts.map((post) => [post.id, post]));
    const matches = vectorMatches
      .map((match) => {
        const post = postById.get(match.id);

        if (!post) {
          return null;
        }

        return {
          post,
          score: match.score,
        };
      })
      .filter((match): match is { post: NonNullable<typeof posts[number]>; score: number } => Boolean(match));

    return {
      matches,
      query,
      totalCount: matches.length,
    };
  }

  private readTagNames(tags: PostForVector["tags"]) {
    return tags.map((postTag) => postTag.tag.name);
  }

  private shouldEmbedPost(post: PostForVector) {
    return this.readTagNames(post.tags).includes(EMBEDDING_TARGET_TAG_NAME);
  }

  private postSearchSelect() {
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

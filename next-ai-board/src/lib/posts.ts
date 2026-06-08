import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PostDetail, PostSummary } from "@/types/post";

export const POSTS_PER_PAGE = 5;

const postInclude = {
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
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makeExcerpt(content: string) {
  const compactContent = content.replace(/\s+/g, " ").trim();

  if (compactContent.length <= 120) {
    return compactContent;
  }

  return `${compactContent.slice(0, 120)}...`;
}

function pickAccent(tags: string[]) {
  if (tags.includes("RAG")) {
    return "#7c3cff";
  }

  if (tags.includes("MCP")) {
    return "#f04484";
  }

  if (tags.includes("Agent")) {
    return "#111111";
  }

  return "#ef3f7b";
}

export function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

export function buildExcerpt(content: string) {
  return makeExcerpt(content);
}

export function mapPostSummary(post: PostWithRelations): PostSummary {
  const tags = post.tags.map((postTag) => postTag.tag.name);
  const createdAt = formatDate(post.createdAt);

  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt ?? makeExcerpt(post.content),
    authorName: post.author.name,
    commentCount: post._count.comments,
    tags,
    createdAt,
    venue: "AI 게시판",
    period: createdAt,
    badge: post.viewCount > 20 ? "인기" : "신규",
    accent: pickAccent(tags),
    discount: tags[0] ?? "AI",
  };
}

export function mapPostDetail(post: PostWithRelations): PostDetail {
  return {
    ...mapPostSummary(post),
    content: post.content,
    authorId: post.author.id,
  };
}

export async function getPopularTags(limit = 8) {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return tags
    .sort((a, b) => b._count.posts - a._count.posts)
    .slice(0, limit)
    .map((tag) => tag.name);
}

export async function getTagStats() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      postCount: tag._count.posts,
    }))
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
}

export async function listPosts({
  page = 1,
  query = "",
  tag = "",
}: {
  page?: number;
  query?: string;
  tag?: string;
}) {
  const currentPage = Math.max(1, page);
  const trimmedQuery = query.trim();
  const trimmedTag = tag.trim();
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
  };

  if (trimmedQuery) {
    where.OR = [
      { title: { contains: trimmedQuery, mode: "insensitive" } },
      { content: { contains: trimmedQuery, mode: "insensitive" } },
      {
        tags: {
          some: {
            tag: {
              name: { contains: trimmedQuery, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  if (trimmedTag) {
    where.tags = {
      some: {
        tag: {
          name: {
            equals: trimmedTag,
            mode: "insensitive",
          },
        },
      },
    };
  }

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map(mapPostSummary),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE)),
    currentPage,
  };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });

  return post ? mapPostDetail(post) : null;
}

export async function connectTags(tagNames: string[]) {
  return tagNames.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name },
        create: { name },
      },
    },
  }));
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expiredSessionResponse, getExistingSessionUser } from "@/lib/auth-user";
import { buildExcerpt, connectTags, listPosts, parseTags } from "@/lib/posts";
import { trySyncPostEmbedding } from "@/lib/rag";

type PostBody = {
  title?: string;
  content?: string;
  tags?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const result = await listPosts({
    page: Number.isNaN(page) ? 1 : page,
    query,
    tag,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const currentUser = await getExistingSessionUser();

  if (!currentUser) {
    return expiredSessionResponse();
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const title = body?.title?.trim() ?? "";
  const content = body?.content?.trim() ?? "";
  const tagNames = parseTags(body?.tags ?? "");

  if (!title || !content) {
    return NextResponse.json(
      { message: "제목과 본문을 입력하세요." },
      { status: 400 },
    );
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      excerpt: buildExcerpt(content),
      authorId: currentUser.user.id,
      tags: {
        create: await connectTags(tagNames),
      },
    },
    select: {
      id: true,
    },
  });

  const embeddingSynced = await trySyncPostEmbedding({
    postId: post.id,
    title,
    content,
  });

  return NextResponse.json(
    {
      id: post.id,
      embeddingSynced,
    },
    { status: 201 },
  );
}

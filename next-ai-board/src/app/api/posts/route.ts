import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildExcerpt, connectTags, listPosts, parseTags } from "@/lib/posts";
import { syncPostEmbedding } from "@/lib/rag";
import { getSession } from "@/lib/session";

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
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
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
      authorId: session.userId,
      tags: {
        create: await connectTags(tagNames),
      },
    },
    select: {
      id: true,
    },
  });

  await syncPostEmbedding({
    postId: post.id,
    title,
    content,
  });

  return NextResponse.json({ id: post.id }, { status: 201 });
}

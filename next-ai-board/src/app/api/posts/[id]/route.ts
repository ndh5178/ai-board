import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildExcerpt, connectTags, getPostById, parseTags } from "@/lib/posts";
import { syncPostEmbedding } from "@/lib/rag";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PostBody = {
  title?: string;
  content?: string;
  tags?: string;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ post });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (post.authorId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { message: "게시글을 수정할 권한이 없습니다." },
      { status: 403 },
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

  await prisma.$transaction([
    prisma.postTag.deleteMany({
      where: { postId: id },
    }),
    prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        excerpt: buildExcerpt(content),
        tags: {
          create: await connectTags(tagNames),
        },
      },
    }),
  ]);

  await syncPostEmbedding({
    postId: id,
    title,
    content,
  });

  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (post.authorId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json(
      { message: "게시글을 삭제할 권한이 없습니다." },
      { status: 403 },
    );
  }

  await prisma.post.delete({
    where: { id },
  });

  return NextResponse.json({ id });
}

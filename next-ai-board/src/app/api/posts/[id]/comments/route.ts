import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listCommentsByPostId } from "@/lib/comments";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CommentBody = {
  content?: string;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const session = await getSession();
  const comments = await listCommentsByPostId(
    id,
    session?.userId,
    session?.role,
  );

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: RouteContext) {
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
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as CommentBody | null;
  const content = body?.content?.trim() ?? "";

  if (!content) {
    return NextResponse.json(
      { message: "댓글 내용을 입력하세요." },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId: id,
      authorId: session.userId,
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ id: comment.id }, { status: 201 });
}

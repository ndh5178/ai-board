import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCommentOwner } from "@/lib/comments";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CommentBody = {
  content?: string;
};

function canManageComment(
  authorId: string,
  session: { userId: string; role: string },
) {
  return authorId === session.userId || session.role === "ADMIN";
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
  const comment = await getCommentOwner(id);

  if (!comment) {
    return NextResponse.json(
      { message: "댓글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (!canManageComment(comment.authorId, session)) {
    return NextResponse.json(
      { message: "댓글을 수정할 권한이 없습니다." },
      { status: 403 },
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

  await prisma.comment.update({
    where: { id },
    data: { content },
  });

  return NextResponse.json({ id, postId: comment.postId });
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
  const comment = await getCommentOwner(id);

  if (!comment) {
    return NextResponse.json(
      { message: "댓글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (!canManageComment(comment.authorId, session)) {
    return NextResponse.json(
      { message: "댓글을 삭제할 권한이 없습니다." },
      { status: 403 },
    );
  }

  await prisma.comment.delete({
    where: { id },
  });

  return NextResponse.json({ id, postId: comment.postId });
}

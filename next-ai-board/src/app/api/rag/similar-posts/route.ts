import { NextResponse } from "next/server";
import { findSimilarPosts } from "@/lib/rag";

type SimilarPostsBody = {
  title?: string;
  content?: string;
  excludePostId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | SimilarPostsBody
    | null;
  const title = body?.title?.trim() ?? "";
  const content = body?.content?.trim() ?? "";
  const excludePostId = body?.excludePostId?.trim() || undefined;

  if (!title && !content) {
    return NextResponse.json(
      { message: "제목이나 본문을 입력한 뒤 유사 게시글을 찾을 수 있습니다." },
      { status: 400 },
    );
  }

  try {
    const posts = await findSimilarPosts({
      title,
      content,
      excludePostId,
    });

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json(
      {
        message:
          "RAG 검색 준비가 아직 끝나지 않았습니다. DB 마이그레이션과 pgvector 설정을 확인하세요.",
      },
      { status: 503 },
    );
  }
}

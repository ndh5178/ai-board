import type { Comment } from "@/types/comment";
import type { PostDetail } from "@/types/post";

export const mockPosts: PostDetail[] = [
  {
    id: "1",
    title: "RAG로 유사 게시글을 추천하는 흐름 정리",
    excerpt: "게시글 작성 중 기존 질문을 찾아 중복을 줄이는 아이디어입니다.",
    content:
      "게시글 제목과 본문을 embedding으로 바꾼 뒤, pgvector에서 가까운 게시글을 찾는 방식으로 시작합니다. 검색 결과는 LLM에게 넘겨 요약문과 함께 보여줍니다.",
    authorName: "민준",
    commentCount: 4,
    tags: ["RAG", "pgvector", "Next.js"],
    createdAt: "2026-06-05",
    venue: "AI 응용 질문관",
    period: "2026.6.5 ~ 6.12",
    badge: "좌석우위",
    accent: "#7c3cff",
    discount: "BEST",
  },
  {
    id: "2",
    title: "MCP로 외부 날씨 데이터를 게시글 초안에 넣기",
    excerpt: "외부 API를 MCP 도구로 감싸고 게시판에서 호출하는 실험입니다.",
    content:
      "MCP 서버가 날씨 API를 호출하고, 게시판은 그 결과를 받아 공지글 초안을 만듭니다. API Key는 서버 환경변수로 관리합니다.",
    authorName: "서연",
    commentCount: 2,
    tags: ["MCP", "API", "Agent"],
    createdAt: "2026-06-04",
    venue: "외부 API 연동관",
    period: "2026.6.4 ~ 6.18",
    badge: "단독판매",
    accent: "#f04484",
    discount: "HOT",
  },
  {
    id: "3",
    title: "게시판 태그 구조를 어떻게 잡으면 좋을까?",
    excerpt: "Post, Tag, PostTag 모델을 나누는 방식에 대한 질문입니다.",
    content:
      "태그는 여러 게시글에서 재사용되기 때문에 PostTag 연결 테이블을 두는 편이 좋습니다. 검색과 필터링도 이 구조가 더 다루기 쉽습니다.",
    authorName: "도윤",
    commentCount: 7,
    tags: ["DB", "Prisma", "Tag"],
    createdAt: "2026-06-03",
    venue: "데이터 모델링홀",
    period: "2026.6.3 ~ 6.20",
    badge: "추천",
    accent: "#111111",
    discount: "NEW",
  },
];

export const mockComments: Comment[] = [
  {
    id: "1",
    authorName: "하린",
    content: "작성 화면에서 바로 추천되면 중복 질문을 많이 줄일 수 있을 것 같아요.",
    createdAt: "2026-06-05",
  },
  {
    id: "2",
    authorName: "지우",
    content: "검색 결과에는 원문 링크와 요약을 같이 보여주면 좋겠습니다.",
    createdAt: "2026-06-05",
  },
];

export const popularTags = ["RAG", "MCP", "Agent", "Next.js", "Prisma"];

export function findPostById(id: string) {
  return mockPosts.find((post) => post.id === id) ?? mockPosts[0];
}

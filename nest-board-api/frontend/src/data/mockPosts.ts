import type { PostSummary } from "../types/post";

export const mockPosts: PostSummary[] = [
  {
    authorEmail: "donghyun@example.com",
    id: "1",
    title: "NestJS 게시판 API 구조를 어떻게 나누면 좋을까?",
    excerpt: "Controller, Service, Module 역할을 게시판 예제로 정리합니다.",
    content:
      "NestJS에서는 요청을 Controller가 받고, 실제 비즈니스 로직은 Service가 처리합니다.\n\n게시판에서는 PostController가 URL을 담당하고, PostService가 DB 저장과 조회를 담당하는 흐름으로 나누면 이해하기 쉽습니다.",
    authorName: "동현",
    createdAt: "2026-06-11",
    commentCount: 4,
    tags: ["NestJS", "Backend", "Architecture"],
    accent: "#ef3f7b",
  },
  {
    authorEmail: "jihyun@example.com",
    id: "2",
    title: "React 화면에서 API 연결 전 먼저 잡아야 하는 구조",
    excerpt: "페이지, 컴포넌트, API client를 분리하는 기준을 정리합니다.",
    content:
      "React 프론트엔드는 사용자가 보는 화면을 담당합니다.\n\nAPI 연결 전에는 라우팅, 공통 레이아웃, 카드와 폼 같은 반복 컴포넌트를 먼저 잡아두면 다음 작업이 편해집니다.",
    authorName: "지현",
    createdAt: "2026-06-11",
    commentCount: 2,
    tags: ["React", "Frontend"],
    accent: "#7c3cff",
  },
  {
    authorEmail: "minsu@example.com",
    id: "3",
    title: "Next.js와 NestJS + React 구조는 뭐가 다를까?",
    excerpt: "한 프로젝트에서 처리하던 흐름을 프론트와 백엔드로 나눠 봅니다.",
    content:
      "Next.js에서는 화면과 API Route를 한 프로젝트 안에서 관리했습니다.\n\nNestJS + React 구조에서는 React가 화면을 담당하고, NestJS가 API 서버를 담당합니다.",
    authorName: "민수",
    createdAt: "2026-06-10",
    commentCount: 6,
    tags: ["Next.js", "NestJS", "React"],
    accent: "#1f9d8a",
  },
];

export const popularTags = Array.from(
  new Set(mockPosts.flatMap((post) => post.tags)),
);

import type { UpsertJobPostingInput } from "../rag/rag.service";

export function listMockJobPostings(): UpsertJobPostingInput[] {
  return [
    {
      company: "Jungle Labs",
      deadline: new Date("2026-09-30T14:59:59.000Z"),
      description:
        "TypeScript와 NestJS를 사용해 REST API를 개발하고 MariaDB 기반 게시판과 인증 기능을 운영할 주니어 백엔드 개발자를 찾습니다.",
      experience: "신입/주니어",
      externalId: "mock-nest-backend-junior",
      location: "서울 / 하이브리드",
      skills: ["TypeScript", "NestJS", "MariaDB", "Prisma", "REST API"],
      source: "mock",
      title: "주니어 NestJS 백엔드 개발자",
      url: "https://example.com/jobs/mock-nest-backend-junior",
    },
    {
      company: "Frontend Works",
      deadline: new Date("2026-10-15T14:59:59.000Z"),
      description:
        "React와 Vite 기반 프론트엔드 화면을 만들고 백엔드 API와 연동하는 풀스택 성향의 신입 개발자를 모집합니다.",
      experience: "신입",
      externalId: "mock-react-fullstack-intern",
      location: "원격 가능",
      skills: ["React", "Vite", "TypeScript", "API 연동"],
      source: "mock",
      title: "React 풀스택 인턴",
      url: "https://example.com/jobs/mock-react-fullstack-intern",
    },
    {
      company: "Career AI",
      deadline: new Date("2026-12-31T14:59:59.000Z"),
      description:
        "RAG, MCP, AI Agent를 활용해 사용자 글을 분석하고 추천 서비스를 만드는 AI 웹 애플리케이션 개발자를 찾습니다.",
      experience: "주니어",
      externalId: "mock-ai-web-application",
      location: "서울",
      skills: ["RAG", "MCP", "AI Agent", "React", "NestJS"],
      source: "mock",
      title: "AI 웹 애플리케이션 주니어 개발자",
      url: "https://example.com/jobs/mock-ai-web-application",
    },
    {
      company: "Data Board",
      deadline: new Date("2026-08-31T14:59:59.000Z"),
      description:
        "MySQL과 MariaDB를 활용한 서비스 데이터 모델링, Prisma ORM, 검색과 페이징 API 구현 경험을 우대합니다.",
      experience: "신입/주니어",
      externalId: "mock-database-api-developer",
      location: "부산 / 원격 협의",
      skills: ["MariaDB", "MySQL", "Prisma", "Pagination", "Search"],
      source: "mock",
      title: "데이터베이스 API 개발자",
      url: "https://example.com/jobs/mock-database-api-developer",
    },
  ];
}

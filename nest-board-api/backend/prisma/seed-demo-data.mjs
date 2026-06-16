import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const DEMO_EMAIL = "demo@careerboard.local";
const DEMO_PASSWORD = "demo1234!";

const demoPosts = [
  {
    title: "React 프론트엔드 신입 포트폴리오 피드백을 받고 싶습니다",
    content:
      "React와 TypeScript로 게시판 프로젝트를 만들고 있습니다. 컴포넌트 분리, API 연결, 반응형 UI를 중심으로 포트폴리오를 정리하고 있는데 어떤 부분을 더 보강하면 좋을지 의견을 듣고 싶습니다.",
    tags: ["react", "frontend", "portfolio"],
  },
  {
    title: "NestJS 백엔드 구조를 처음 공부할 때 보면 좋은 흐름",
    content:
      "Controller, Service, Module, DTO가 어떤 흐름으로 연결되는지 정리했습니다. 프론트에서 API 요청이 들어오면 Controller가 받고 Service가 비즈니스 로직을 처리한 뒤 Prisma로 DB에 접근하는 흐름입니다.",
    tags: ["nestjs", "backend", "api"],
  },
  {
    title: "MariaDB와 Prisma로 게시판 데이터를 관리하는 방법",
    content:
      "회원, 게시글, 댓글, 태그 테이블을 나누고 Prisma 관계 설정으로 연결했습니다. 게시글 목록에서는 작성자, 댓글 수, 태그를 함께 조회해서 화면 카드에 표시합니다.",
    tags: ["mariadb", "prisma", "database"],
  },
  {
    title: "AI 게시판에서 RAG를 어디에 붙이면 좋을까",
    content:
      "사용자가 작성한 글을 임베딩하고 비슷한 게시글을 찾아주는 기능을 RAG의 기초 기능으로 구현할 수 있습니다. 이후에는 취업 준비 글, 학습 기록, 프로젝트 회고를 바탕으로 맞춤형 추천까지 확장할 수 있습니다.",
    tags: ["ai", "rag", "embedding"],
  },
  {
    title: "취업 준비 게시판을 사람인 스타일로 바꾸는 중입니다",
    content:
      "홈 화면은 검색, 카테고리 바로가기, 주요채용 카드 구조로 만들고 있습니다. 실제 채용 공고 대신 게시글 데이터를 카드로 보여주되, 사용자가 보기에는 채용 서비스처럼 느껴지도록 구성합니다.",
    tags: ["ui", "career", "design"],
  },
  {
    title: "로그인 후 글쓰기와 댓글 작성 흐름을 점검했습니다",
    content:
      "프론트에서는 토큰을 localStorage에 저장하고 API 요청 시 Authorization 헤더로 보냅니다. 백엔드는 AuthGuard에서 토큰을 검증한 뒤 현재 사용자를 Controller에 전달합니다.",
    tags: ["auth", "jwt", "comment"],
  },
  {
    title: "게시글 검색은 키워드 검색과 벡터 검색을 나눠서 생각해야 합니다",
    content:
      "목록 페이지의 검색은 제목과 본문을 대상으로 하는 키워드 검색입니다. RAG 검색은 질문을 임베딩해서 비슷한 의미의 게시글을 찾는 별도 기능으로 두는 편이 이해하기 좋습니다.",
    tags: ["search", "rag", "keyword"],
  },
  {
    title: "2주 프로젝트에서 백엔드를 여러 개 만들어 보는 전략",
    content:
      "Next.js, NestJS, Spring Boot를 각각 작은 게시판으로 만들어 보면 같은 요구사항을 다른 구조로 경험할 수 있습니다. 단, 각 프로젝트의 완성 범위는 작게 잡는 것이 좋습니다.",
    tags: ["project", "nestjs", "springboot"],
  },
];

function buildExcerpt(content) {
  return content.replace(/\s+/g, " ").slice(0, 160);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, KEY_LENGTH);

  return `scrypt:${salt}:${key.toString("hex")}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });

  try {
    const user = await prisma.user.upsert({
      create: {
        email: DEMO_EMAIL,
        name: "커리어보드 데모",
        passwordHash: await hashPassword(DEMO_PASSWORD),
        role: "USER",
      },
      update: {
        name: "커리어보드 데모",
      },
      where: {
        email: DEMO_EMAIL,
      },
    });

    await prisma.post.deleteMany({
      where: {
        authorId: user.id,
      },
    });

    for (const [index, post] of demoPosts.entries()) {
      await prisma.post.create({
        data: {
          authorId: user.id,
          content: post.content,
          createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
          excerpt: buildExcerpt(post.content),
          tags: {
            create: post.tags.map((name) => ({
              tag: {
                connectOrCreate: {
                  create: {
                    name,
                  },
                  where: {
                    name,
                  },
                },
              },
            })),
          },
          title: post.title,
          viewCount: 20 + index * 7,
        },
      });
    }

    console.log(`Seeded ${demoPosts.length} demo posts for ${DEMO_EMAIL}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

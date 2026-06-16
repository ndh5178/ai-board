import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const STYLE_ANALYSIS_TAG_NAME = "스타일 분석";
const DEFAULT_ADMIN_EMAIL = "ehdgus5178@gmail.com";

const samplePosts = [
  {
    title: "[스타일 분석 샘플 01] React 상태 관리를 공부하며 느낀 점",
    content:
      "React에서 useState를 처음 배울 때는 단순히 값을 저장하는 도구라고 생각했습니다. 그런데 로그인 폼을 직접 만들면서 입력값이 화면과 코드 사이에서 어떻게 이어지는지 보이기 시작했습니다. 아직은 이벤트 흐름을 자주 헷갈리지만, 실제 기능에 붙여보니 왜 상태 관리가 필요한지 이해가 됩니다.",
  },
  {
    title: "[스타일 분석 샘플 02] API 요청 흐름을 따라가 본 기록",
    content:
      "프론트에서 버튼을 누르면 fetch가 실행되고, 백엔드 Controller가 요청을 받는 흐름을 정리했습니다. 처음에는 함수가 어디서 실행되는지 감이 없었는데, 파일을 하나씩 따라가면서 Service와 Prisma가 어떤 역할인지 조금씩 구분되고 있습니다. 앞으로는 요청, 검증, DB 저장 순서로 먼저 생각해보려고 합니다.",
  },
  {
    title: "[스타일 분석 샘플 03] Prisma와 DB 관계를 이해하는 중",
    content:
      "Prisma schema를 보면 User, Post, Comment가 서로 어떻게 연결되는지 알 수 있습니다. 관계 설정이 처음에는 복잡해 보였지만, 실제로 게시글을 삭제하면 댓글도 같이 삭제되는 구조를 보며 데이터 모델의 중요성을 느꼈습니다. DB는 단순 저장소가 아니라 서비스 규칙을 담는 곳이라는 생각이 들었습니다.",
  },
  {
    title: "[스타일 분석 샘플 04] 에러 메시지를 읽는 습관",
    content:
      "예전에는 에러가 나오면 바로 무섭고 막막했는데, 요즘은 파일 경로와 줄 번호부터 보려고 합니다. NestJS 에러 로그에서 어떤 Service에서 문제가 났는지 확인하고, 그 다음 환경변수나 DB 연결을 의심하는 방식으로 접근했습니다. 아직 해결 속도는 느리지만 원인을 좁혀가는 과정이 조금 익숙해졌습니다.",
  },
  {
    title: "[스타일 분석 샘플 05] 컴포넌트를 나누는 기준에 대한 고민",
    content:
      "프론트엔드에서 모든 코드를 한 페이지에 넣으면 처음에는 편하지만 금방 읽기 어려워집니다. 로그인 폼, 게시글 카드, 댓글 영역처럼 역할이 분명한 부분은 컴포넌트로 분리하는 편이 좋다는 것을 배웠습니다. 다만 너무 빨리 나누면 흐름이 더 안 보일 수 있어서 기준을 잡는 연습이 필요합니다.",
  },
  {
    title: "[스타일 분석 샘플 06] RAG를 게시판에 붙이는 방법을 이해한 과정",
    content:
      "RAG는 단순히 AI에게 질문하는 것이 아니라, 내가 가진 데이터를 먼저 찾아서 그 내용을 바탕으로 답하게 만드는 구조라고 이해했습니다. 게시글을 임베딩해서 저장하고, 사용자의 검색어나 글과 비슷한 데이터를 찾는 방식이 핵심입니다. 아직 벡터 DB 개념은 어렵지만 왜 필요한지는 감이 잡혔습니다.",
  },
  {
    title: "[스타일 분석 샘플 07] 프로젝트를 여러 백엔드로 나눠보는 이유",
    content:
      "Next.js, NestJS, Spring Boot를 각각 써보면 같은 게시판도 구조가 다르게 보입니다. 처음에는 하나만 깊게 하는 게 좋다고 생각했지만, 여러 방식을 비교하니 백엔드의 공통 역할이 더 잘 보였습니다. Controller, Service, DB 접근이라는 큰 흐름은 비슷하고 표현 방식만 다르다는 점이 흥미로웠습니다.",
  },
  {
    title: "[스타일 분석 샘플 08] 디자인을 바꿀 때 기능을 건드리지 않는 연습",
    content:
      "상세페이지와 글쓰기 페이지를 수정하면서 버튼 기능은 유지하고 구조와 스타일만 바꾸는 연습을 했습니다. UI를 손보다 보면 기능 코드까지 건드리고 싶어지지만, 변경 범위를 나누는 게 중요하다는 것을 느꼈습니다. 앞으로는 스타일 변경인지 기능 변경인지 먼저 구분하고 작업하려고 합니다.",
  },
  {
    title: "[스타일 분석 샘플 09] 로그인과 인증 흐름 정리",
    content:
      "로그인은 사용자가 이메일과 비밀번호를 보내고, 백엔드가 검증한 뒤 토큰을 발급하는 흐름입니다. 프론트는 그 토큰을 저장했다가 API 요청마다 Authorization 헤더로 보냅니다. 처음에는 로그인 상태가 화면에서만 관리되는 줄 알았는데, 실제로는 프론트와 백엔드가 같이 약속을 지키는 구조였습니다.",
  },
  {
    title: "[스타일 분석 샘플 10] 내가 질문하면서 배우는 방식",
    content:
      "코드를 한 번에 이해하려고 하기보다, 버튼 하나를 눌렀을 때 어떤 파일과 함수로 이동하는지 묻는 방식이 저에게 잘 맞는 것 같습니다. 작은 흐름을 먼저 이해하면 전체 구조도 조금씩 연결됩니다. 앞으로도 모르는 용어가 나오면 바로 넘기지 않고, 실제 코드 안에서 어떤 역할인지 확인하려고 합니다.",
  },
];

function buildExcerpt(content) {
  return content.replace(/\s+/g, " ").slice(0, 160);
}

function readAdminEmail() {
  return (
    process.env.STYLE_ANALYSIS_SEED_EMAIL ??
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean)[0] ??
    DEFAULT_ADMIN_EMAIL
  ).toLowerCase();
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const adminEmail = readAdminEmail();
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });

  try {
    const admin = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });

    if (!admin) {
      throw new Error(`${adminEmail} 관리자 계정을 먼저 만든 뒤 다시 실행해주세요.`);
    }

    if (admin.role !== "ADMIN") {
      throw new Error(`${adminEmail} 계정이 ADMIN 권한이 아닙니다.`);
    }

    await prisma.post.deleteMany({
      where: {
        authorId: admin.id,
        title: {
          startsWith: "[스타일 분석 샘플",
        },
      },
    });

    for (const [index, post] of samplePosts.entries()) {
      await prisma.post.create({
        data: {
          authorId: admin.id,
          content: post.content,
          createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 12),
          excerpt: buildExcerpt(post.content),
          tags: {
            create: [
              {
                tag: {
                  connectOrCreate: {
                    create: {
                      name: STYLE_ANALYSIS_TAG_NAME,
                    },
                    where: {
                      name: STYLE_ANALYSIS_TAG_NAME,
                    },
                  },
                },
              },
            ],
          },
          title: post.title,
        },
      });
    }

    console.log(`Seeded ${samplePosts.length} style-analysis posts for ${adminEmail}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

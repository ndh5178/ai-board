# AI Board

React, NestJS, MariaDB, ChromaDB, OpenAI API를 사용해 구현한 AI 활용 게시판입니다. 기본 게시판 기능을 바탕으로 RAG, MCP, AI Agent 기능을 붙여 사용자가 작성한 글과 외부 채용 데이터를 연결하는 커리어 게시판 형태로 만들었습니다.

## 1. 프로젝트 개요

이 프로젝트의 목표는 단순 CRUD 게시판이 아니라, 실제 서비스에서 AI 기능이 어떻게 백엔드와 데이터베이스, 외부 API와 연결되는지 직접 구현해 보는 것입니다.

최종 구현 소스는 `nest-board-api` 폴더입니다.

| 구분 | 사용 기술 | 역할 |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | 화면, 라우팅, 로그인 상태, 게시판 UI |
| Backend | NestJS, TypeScript | REST API, 인증, 게시글/댓글/태그 처리, AI 기능 orchestration |
| Database | MariaDB, Prisma | 사용자, 게시글, 댓글, 태그, 채용공고, 분석 결과 저장 |
| Vector DB | ChromaDB | 게시글/채용공고 임베딩 벡터 저장 및 유사도 검색 |
| AI | OpenAI Embedding, OpenAI Chat Model | 임베딩 생성, 글쓰기 스타일 분석 |
| MCP | JSON-RPC 기반 MCP Server | 외부 채용 API 도구 호출 구조 제공 |

루트에는 학습 비교를 위해 `next-ai-board`, `fastapi-rag-board`, `spring-board-api` 폴더도 있지만, 제출 기준의 완성 구현은 `nest-board-api`입니다.

## 2. 주요 구현 기능

### 기본 게시판 기능

- 회원가입 / 로그인
- JWT 기반 인증 상태 관리
- 게시글 CRUD
- 댓글 작성, 수정, 삭제
- 태그 등록 및 태그별 조회
- 게시글 목록, 상세 페이지, 내 글 페이지
- 검색 및 페이징
- 마이페이지
- 설정 페이지
- 비밀번호 변경
- 회원 탈퇴
- 관리자 전용 기능

### AI 활용 기능

- `채용` 태그와 채용 관련 키워드가 있는 게시글을 기준으로 채용공고 추천 댓글 자동 생성
- 사람인 API 검색을 우선 사용하고, 실패하거나 결과가 부족하면 fallback RAG 검색 사용
- 원티드 fallback seed 채용공고를 MariaDB와 ChromaDB에 저장
- `스타일 분석` 태그가 붙은 내 게시글 10개 이상을 기준으로 LLM 글쓰기 스타일 분석
- MCP JSON-RPC 서버를 통해 외부 채용 API 검색 도구 호출

## 3. 전체 아키텍처 구조

```mermaid
flowchart LR
  User["사용자"] --> Frontend["React Frontend\nlocalhost:5173"]
  Frontend --> ApiClient["apiRequest\n공통 API 요청 함수"]
  ApiClient --> Backend["NestJS Backend\nlocalhost:3001"]

  Backend --> Auth["Auth Module\n로그인/회원가입/JWT"]
  Backend --> Posts["Posts Module\n게시글/태그/댓글 후처리"]
  Backend --> Comments["Comments Module\n댓글 CRUD"]
  Backend --> Me["Me Module\n마이페이지/설정"]
  Backend --> AI["AI Module\n글쓰기 스타일 분석"]
  Backend --> MCP["MCP Module\nJSON-RPC tools/call"]
  Backend --> RAG["RAG Module\n임베딩/유사도 검색"]
  Backend --> Jobs["JobPostings Module\n채용공고 동기화/검색"]

  Auth --> MariaDB["MariaDB\nusers/posts/comments/tags/job_postings"]
  Posts --> MariaDB
  Comments --> MariaDB
  Me --> MariaDB
  AI --> OpenAIChat["OpenAI Chat Model"]
  RAG --> OpenAIEmbedding["OpenAI Embedding Model"]
  RAG --> Chroma["ChromaDB\nboard_posts_openai\njob_postings_openai"]
  Jobs --> Saramin["Saramin API"]
  Jobs --> MariaDB
  MCP --> Saramin
```

### 실행 구조

- `frontend/src/main.tsx`에서 React 앱이 시작됩니다.
- `frontend/src/App.tsx`에서 라우팅이 결정됩니다.
- 프론트엔드는 `frontend/src/api/client.ts`의 `apiRequest`를 통해 백엔드로 요청합니다.
- 백엔드는 `backend/src/app.module.ts`에서 기능 모듈을 조립합니다.
- 각 Controller가 HTTP 요청을 받고, Service가 실제 비즈니스 로직을 처리합니다.
- DB 처리는 Prisma를 통해 MariaDB에 저장됩니다.
- AI 검색과 추천은 OpenAI Embedding, ChromaDB, 외부 API를 함께 사용합니다.

## 4. AI 활용 기능, 기술, 아키텍처 구조

### 4.1 RAG 기능

RAG는 사용자의 게시글과 채용공고 데이터를 임베딩한 뒤, 의미적으로 비슷한 데이터를 찾아 AI 기능에 활용하는 구조입니다.

이 프로젝트에서는 채용공고 추천 fallback 경로에서 RAG를 사용합니다.

```mermaid
flowchart TD
  Post["사용자 게시글\n태그: 채용"] --> Check["채용 관련 키워드 검사"]
  Check --> EmbedPost["OpenAI Embedding으로 게시글 벡터 생성"]
  EmbedPost --> BoardCollection["ChromaDB\nboard_posts_openai 저장"]
  JobSeed["원티드 fallback seed 채용공고"] --> EmbedJob["OpenAI Embedding으로 공고 벡터 생성"]
  EmbedJob --> JobCollection["ChromaDB\njob_postings_openai 저장"]
  EmbedPost --> Search["job_postings_openai 유사도 검색"]
  Search --> MariaDBJob["MariaDB job_postings 원본 조회"]
  MariaDBJob --> Comment["AI 에이전트 댓글 생성"]
```

사용 기술:

- OpenAI Embedding Model: `text-embedding-3-small`
- Vector DB: ChromaDB
- DB 원본 저장소: MariaDB `job_postings`
- 주요 코드:
  - `nest-board-api/backend/src/rag/rag.service.ts`
  - `nest-board-api/backend/src/rag/chroma-vector.service.ts`
  - `nest-board-api/backend/src/job-postings/job-postings.service.ts`

구현 기준:

- 모든 게시글을 임베딩하지 않습니다.
- `채용` 태그가 있고, 제목/본문에 채용 관련 키워드가 있을 때만 게시글 임베딩을 수행합니다.
- 채용공고는 fallback seed 데이터를 `job_postings_openai` 컬렉션에 임베딩해 둡니다.

### 4.2 MCP 기능

MCP는 LLM 또는 Agent가 외부 시스템을 도구처럼 호출할 수 있도록 만드는 구조입니다. 이 프로젝트에서는 JSON-RPC 기반 MCP Server를 NestJS 안에 구현했습니다.

```mermaid
sequenceDiagram
  participant Client as MCP Client
  participant MCP as NestJS MCP Module
  participant Tool as search_saramin_jobs Tool
  participant Saramin as Saramin API

  Client->>MCP: POST /mcp/json-rpc
  MCP->>MCP: JSON-RPC 요청 검증
  MCP->>Tool: tools/call name=search_saramin_jobs
  Tool->>Saramin: 채용공고 검색 요청
  Saramin-->>Tool: 검색 결과
  Tool-->>MCP: jobs, criteria, totalCount
  MCP-->>Client: JSON-RPC 2.0 response
```

사용 기술:

- JSON-RPC 2.0
- NestJS Controller / Service
- Saramin Open API
- 환경변수 기반 API Key 관리

주요 코드:

- `nest-board-api/backend/src/mcp/mcp.controller.ts`
- `nest-board-api/backend/src/mcp/mcp.service.ts`
- `nest-board-api/backend/src/mcp/mcp.dto.ts`

API Key 관리:

- `.env`에 `SARAMIN_API_KEY`를 설정합니다.
- `.env.example`에는 실제 키를 넣지 않고 필요한 변수명만 제공합니다.
- 키가 없거나 API가 실패하면 서비스 로직은 fallback RAG 경로를 사용할 수 있습니다.

### 4.3 Agent 기능

AI Agent는 사용자가 게시글을 작성한 뒤, 조건을 판단하고 어떤 도구를 사용할지 선택해 댓글을 자동 생성합니다.

```mermaid
flowchart TD
  SavePost["게시글 저장"] --> Trigger["게시글 후처리 실행"]
  Trigger --> IsCareer["채용 태그 + 채용 키워드 확인"]
  IsCareer -- "아니오" --> End["아무 작업 안 함"]
  IsCareer -- "예" --> BuildCriteria["검색 조건 생성\n직무/기술/지역/경력"]
  BuildCriteria --> Loop["Agent Loop\n최대 5단계"]
  Loop --> SaraminSearch["사람인 API 검색"]
  SaraminSearch -- "결과 3개 이상" --> SaveComment["AI 에이전트 댓글 저장"]
  SaraminSearch -- "실패/부족" --> Relax["검색 조건 완화"]
  Relax --> Loop
  Loop -- "API 실패 또는 결과 부족" --> Fallback["Fallback RAG 검색"]
  Fallback --> SaveComment
```

Agent 판단 흐름:

1. 게시글이 `PUBLISHED` 상태인지 확인합니다.
2. `채용` 태그가 있는지 확인합니다.
3. 제목/본문에 채용 관련 키워드가 있는지 확인합니다.
4. 검색 조건을 만듭니다.
5. 사람인 API를 먼저 검색합니다.
6. 결과가 부족하면 조건을 완화해 다시 시도합니다.
7. 그래도 부족하거나 API가 실패하면 ChromaDB fallback RAG를 사용합니다.
8. 최종 추천 공고 3개를 댓글로 저장합니다.

주요 코드:

- `nest-board-api/backend/src/posts/job-recommendation-comment.service.ts`
- `nest-board-api/backend/src/posts/job-search-criteria.ts`
- `nest-board-api/backend/src/common/career-keywords.ts`
- `nest-board-api/backend/src/job-postings/job-postings.service.ts`

무한 루프 방지:

- `MAX_AGENT_STEPS = 5`로 최대 반복 횟수를 제한합니다.
- `JOB_RECOMMENDATION_COMMENT_COOLDOWN_HOURS`로 같은 사용자에게 AI 댓글이 과도하게 생성되는 것을 제한할 수 있습니다.

### 4.4 글쓰기 스타일 분석 기능

마이페이지의 `내 글 스타일 알아보기` 기능은 사용자가 작성한 글 중 `스타일 분석` 태그가 붙은 게시글만 분석 대상으로 사용합니다.

조건:

- 로그인한 사용자 본인의 글
- 상태가 `PUBLISHED`
- 태그가 `스타일 분석`
- 최소 10개 이상

흐름:

1. 프론트엔드 마이페이지에서 분석 버튼을 누릅니다.
2. 백엔드 `GET /ai/me/writing-style` 요청이 실행됩니다.
3. 백엔드는 조건에 맞는 게시글을 DB에서 조회합니다.
4. 10개 미만이면 LLM을 호출하지 않고 안내 메시지를 반환합니다.
5. 10개 이상이면 최근 최대 30개 게시글 원문을 OpenAI Chat Model에 보냅니다.
6. LLM 응답을 DB에 캐싱하고 프론트엔드에 반환합니다.

주요 코드:

- `nest-board-api/backend/src/ai/ai.controller.ts`
- `nest-board-api/backend/src/ai/ai.service.ts`
- `nest-board-api/frontend/src/pages/MyPage.tsx`

## 5. 데모

### 실행 화면

![AI Board 데모 화면](docs/images/demo-home.png)

### 로컬 실행 방법

MariaDB와 ChromaDB 실행:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\nest-board-api
docker compose up -d mariadb chromadb
```

백엔드 실행:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\nest-board-api\backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

프론트엔드 실행:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\nest-board-api\frontend
npm install
npm run dev
```

브라우저 접속:

```text
http://localhost:5173
```

### 주요 환경변수

백엔드 `.env` 기준:

```env
DATABASE_URL=mysql://root:password@localhost:3306/nest_ai_board
JWT_SECRET=change-this-secret-in-local-env
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
SARAMIN_API_KEY=
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## 6. 회고, 한계점, 개선 아이디어

### 회고

이 프로젝트를 구현하면서 프론트엔드, 백엔드, DB, Vector DB, 외부 API, LLM 호출이 각각 따로 존재하는 기술이 아니라 하나의 요청 흐름 안에서 연결된다는 것을 확인할 수 있었습니다.

특히 게시글 저장 후 바로 AI 기능을 실행하는 구조를 만들면서, 단순히 LLM을 호출하는 것보다 언제 호출할지, 어떤 데이터를 보낼지, 실패하면 어떤 대체 경로를 사용할지가 더 중요하다는 점을 배웠습니다.

### 한계점

- 사람인 API 키가 없거나 호출에 실패하면 실시간 공고 검색은 제한됩니다.
- fallback seed 데이터는 시연용 데이터이므로 실제 서비스처럼 최신성을 보장하지 않습니다.
- OpenAI API 비용을 고려해 모든 게시글을 임베딩하지 않고 `채용` 태그와 키워드가 있는 글만 임베딩합니다.
- 글쓰기 스타일 분석은 fine-tuning이 아니라, 사용자의 게시글 원문을 LLM에 보내 분석하는 방식입니다.
- 현재 Agent는 게시글 작성 후 댓글 생성 흐름에 집중되어 있고, 장기 메모리나 복잡한 다중 도구 계획은 제한적입니다.

### 개선 아이디어

- 사람인 API 키 발급 후 실시간 채용공고 검색 정확도 개선
- 채용공고 seed 데이터를 주기적으로 갱신하는 관리자 기능 추가
- ChromaDB 컬렉션 관리 화면 추가
- AI 댓글 생성 결과에 사용자 피드백 기능 추가
- 글쓰기 스타일 분석 결과를 시간 흐름에 따라 비교하는 리포트 기능 추가
- MCP 도구를 채용 API 외에도 GitHub, 일정, 문서 분석 등으로 확장
- Agent가 댓글 작성 전 사용자에게 추천 결과를 미리 보여주고 승인받는 흐름 추가


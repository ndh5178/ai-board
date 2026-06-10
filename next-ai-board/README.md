# next-ai-board

Next.js로 만드는 제출용 AI 게시판 후보입니다.

역할:
- React 화면
- Next.js 백엔드 API
- 게시판 기본 기능
- AI 기능 통합 후보

## Folder Plan

기본 게시판 기능을 먼저 구현하기 위한 폴더 구조입니다.

- `src/app`: Next.js App Router 페이지와 API route
- `src/components`: 화면 컴포넌트
- `src/lib`: DB, 인증, 검증, 페이징 같은 서버/공통 로직
- `src/types`: 게시글, 댓글, 태그, 사용자 타입
- `prisma`: DB 스키마

## Learning Notes

- `NEXTJS.md`: Next.js를 배우면서 생긴 질문과 답을 적는 개인 학습 노트입니다. 이 파일은 `.gitignore`에 등록되어 커밋하지 않습니다.
- [PRISMA.md](./PRISMA.md): Prisma를 왜 쓰는지, 좋은 점과 주의할 점을 정리한 학습 문서입니다.

## App Init

이 브랜치에서는 Next.js 앱으로 실행될 수 있는 최소 세팅을 추가했습니다.

추가한 내용:
- `package.json`: Next.js, React, TypeScript, ESLint 의존성과 실행 스크립트
- `next.config.ts`: Next.js 설정 파일
- `tsconfig.json`: TypeScript 설정과 `@/*` import alias
- `eslint.config.mjs`: Next.js용 ESLint 설정
- `src/app/layout.tsx`: App Router 공통 레이아웃
- `src/app/page.tsx`: 첫 홈 화면
- `src/app/globals.css`: 전역 스타일

실행 순서:

```bash
npm install
npm run dev
```

브라우저에서 확인:

```txt
http://localhost:3000
```

## Local Dev Commands

Windows PowerShell에서 DB와 개발 서버를 직접 켜고 끄는 명령어입니다.

자세한 설명은 개인 학습 문서인 `md/DEV_COMMANDS.md`에 정리했습니다.

기존 DB 컨테이너가 있을 때 시작:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\next-ai-board
docker start next-ai-board-postgres
cmd /c npx prisma migrate dev
cmd /c npm run dev -- -H 0.0.0.0 -p 3000
```

DB 컨테이너를 처음 만들 때:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\next-ai-board
docker run --name next-ai-board-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=next_ai_board `
  -p 5432:5432 `
  -d pgvector/pgvector:pg16
cmd /c npx prisma migrate dev
cmd /c npm run dev -- -H 0.0.0.0 -p 3000
```

종료:

```powershell
netstat -ano | findstr :3000
Stop-Process -Id PID번호 -Force
docker stop next-ai-board-postgres
```

RAG 기능은 pgvector 확장이 필요하므로 DB 컨테이너는 `pgvector/pgvector:pg16` 이미지를 사용합니다.

만약 예전 `postgres:16` 이미지로 만든 `next-ai-board-postgres` 컨테이너가 이미 있다면, 컨테이너 이미지를 바꿀 수 없기 때문에 기존 컨테이너를 직접 삭제하고 다시 만들어야 합니다.

```powershell
docker stop next-ai-board-postgres
docker rm next-ai-board-postgres
```

주의: 기존 컨테이너를 삭제하면 그 컨테이너 안에 있던 개발용 DB 데이터도 함께 사라질 수 있습니다.

## Board Pages

이 브랜치에서는 기본 게시판 기능을 위한 정적 페이지 UI를 추가했습니다.

추가한 페이지:
- `/`: 홈
- `/posts`: 게시글 목록, 검색, 태그, 페이징
- `/posts/new`: 게시글 작성
- `/posts/[id]`: 게시글 상세, 댓글 목록, 댓글 작성
- `/posts/[id]/edit`: 게시글 수정
- `/login`: 로그인
- `/signup`: 회원가입

추가한 구조:
- `src/components/layout`: 공통 헤더와 페이지 레이아웃
- `src/components/posts`: 게시글 카드, 목록, 작성 폼
- `src/components/comments`: 댓글 목록과 댓글 폼
- `src/components/auth`: 로그인/회원가입 폼
- `src/components/search`: 검색 바
- `src/components/pagination`: 페이지네이션
- `src/components/tags`: 태그 배지
- `src/components/ui`: 공통 링크 버튼
- `src/lib/mock-posts.ts`: DB 연결 전 화면 확인용 mock 데이터

현재 단계에서는 DB/API 연결 없이 화면 흐름만 확인합니다. 다음 단계에서 게시글 API와 DB 스키마를 연결합니다.

## Prisma Schema

이 브랜치에서는 기본 게시판 데이터를 저장하기 위한 Prisma 스키마를 추가했습니다.

추가한 모델:
- `User`: 회원가입/로그인 사용자
- `Post`: 게시글
- `Comment`: 댓글
- `Tag`: 태그
- `PostTag`: 게시글과 태그의 다대다 연결 테이블

추가한 설정:
- `prisma/schema.prisma`: Prisma 데이터 모델
- `prisma.config.ts`: Prisma 7 기준 DB 연결 설정
- `.env.example`: `DATABASE_URL` 예시

Prisma 7에서는 DB 연결 URL을 `schema.prisma`가 아니라 `prisma.config.ts`에서 관리합니다.

## Visual Direction

이 브랜치에서는 기존 토스풍 스타일을 NOL 인터파크 티켓 페이지에서 보이는 티켓 커머스 톤에 훨씬 가깝게 조정했습니다.

참고한 방향:
- 상단 유틸리티 바와 메인 네비게이션
- 핑크/보라 계열 포인트 컬러
- 포스터형 히어로 카드
- 장르 탭 바로가기
- 랭킹 번호가 보이는 카드 목록
- 할인/추천 카드 그리드
- 티켓/공연 랭킹 페이지처럼 섹션이 선명하게 나뉘는 구성

브랜드 로고와 실제 공연 이미지는 사용하지 않고, 과제용 게시판 데이터로 같은 구조와 밀도를 재현했습니다.

## Auth API

이 브랜치에서는 회원가입/로그인 API와 폼 제출 흐름을 추가했습니다.

추가한 서버 로직:
- `src/lib/db.ts`: Prisma 7 Postgres adapter 기반 Prisma Client 싱글톤 연결
- `src/lib/password.ts`: `scrypt` 기반 비밀번호 해시/검증
- `src/lib/session.ts`: 서명된 HTTP-only 쿠키 세션 생성/검증/삭제

추가한 API route:
- `POST /api/auth/signup`: 사용자 생성 후 세션 쿠키 발급
- `POST /api/auth/login`: 비밀번호 검증 후 세션 쿠키 발급
- `POST /api/auth/logout`: 세션 쿠키 삭제
- `GET /api/auth/me`: 현재 로그인 사용자 조회

화면 연결:
- 로그인/회원가입 폼은 `/api/auth/login`, `/api/auth/signup`을 호출합니다.
- 성공하면 `/posts`로 이동합니다.

현재 단계에서는 DB 서버가 실제로 연결되어 있어야 API가 정상 동작합니다.

## Protected My Pages

이 브랜치에서는 상단 유틸리티 메뉴를 개인 메뉴로 정리하고, 로그인하지 않은 사용자가 개인 페이지에 접근하면 로그인 페이지로 이동하도록 연결했습니다.

추가한 페이지:
- `/me`: 내 정보
- `/me/posts`: 내가 쓴 글
- `/me/comments`: 내 댓글
- `/settings`: 설정

추가한 흐름:
- 개인 메뉴 클릭
- `requireAuth()`에서 세션 쿠키 확인
- 로그인하지 않았으면 `/login?next=원래가려던주소`로 이동
- 로그인/회원가입 성공 후 `next` 주소로 다시 이동
- 로그인한 상태에서는 헤더의 로그인 버튼이 사용자 이름으로 바뀌고, 옆에 로그아웃 버튼이 표시됨
- 로그아웃 버튼은 HTML form으로 `/api/auth/logout`에 POST 요청을 보내고, 세션 쿠키 삭제 후 `/login`으로 이동함

## Posts CRUD API

이 브랜치에서는 게시글 화면을 mock 데이터에서 DB/API 기반 흐름으로 전환했습니다.

추가한 서버 로직:
- `src/lib/posts.ts`: 게시글 목록/상세 조회, 태그 파싱, 화면용 데이터 변환
- `GET /api/posts`: 게시글 목록 조회, 검색, 태그 필터, 페이징
- `POST /api/posts`: 로그인한 사용자의 게시글 생성
- `GET /api/posts/[id]`: 게시글 상세 조회
- `PATCH /api/posts/[id]`: 작성자 또는 관리자만 게시글 수정
- `DELETE /api/posts/[id]`: 작성자 또는 관리자만 게시글 삭제

화면 연결:
- `/`: DB에 저장된 최신 게시글을 홈 랭킹 영역에 표시
- `/posts`: DB 게시글 목록, 검색, 태그 필터, 페이징 표시
- `/posts/new`: 로그인한 사용자만 게시글 작성 가능
- `/posts/[id]`: DB 게시글 상세 표시
- `/posts/[id]/edit`: 작성자 또는 관리자만 수정 가능

현재 단계:
- 게시글 CRUD는 DB/API에 연결되었습니다.
- 댓글은 아직 mock 데이터를 사용하므로 다음 작업에서 댓글 API와 DB 연결이 필요합니다.

## Comments API

이 브랜치에서는 게시글 상세 페이지의 댓글 기능을 mock 데이터에서 DB/API 기반 흐름으로 전환했습니다.

추가한 서버 로직:
- `src/lib/comments.ts`: 댓글 목록 조회와 화면용 데이터 변환
- `GET /api/posts/[id]/comments`: 특정 게시글의 댓글 목록 조회
- `POST /api/posts/[id]/comments`: 로그인한 사용자의 댓글 작성
- `PATCH /api/comments/[id]`: 작성자 또는 관리자만 댓글 수정
- `DELETE /api/comments/[id]`: 작성자 또는 관리자만 댓글 삭제

화면 연결:
- `/posts/[id]`: DB에 저장된 실제 댓글 표시
- 댓글 폼: 로그인하지 않은 사용자는 로그인 페이지로 이동
- 댓글 목록: 작성자 또는 관리자에게만 수정/삭제 버튼 표시

현재 단계:
- 게시글과 댓글의 기본 CRUD는 DB/API에 연결되었습니다.
- 다음 작업에서는 태그 전용 화면, 검색 고도화, 또는 AI 기능 연결을 진행할 수 있습니다.

## Search And Tags

이 브랜치에서는 게시글 검색과 태그 탐색 흐름을 더 명확하게 정리했습니다.

추가한 화면:
- `/tags`: DB에 저장된 태그 목록과 태그별 게시글 수 표시

개선한 흐름:
- `/posts?q=검색어`: 제목, 본문, 태그 기준 검색
- `/posts?tag=태그명`: 태그 기준 게시글 필터링
- 검색어와 태그 필터가 적용된 상태를 화면에 표시
- 필터 초기화 링크 제공
- 태그 필터 중 검색해도 태그 조건 유지
- 페이징 이동 시 검색어와 태그 조건 유지
- 홈의 태그 바로가기를 실제 게시글 필터 링크로 연결

현재 단계:
- 기본 게시판 요구사항 중 검색, 태그, 페이징 흐름이 화면에서 확인 가능해졌습니다.
- 게시글 삭제 시 더 이상 어떤 게시글에도 연결되지 않은 태그는 자동으로 정리됩니다.

## My Page Data

이 브랜치에서는 개인 페이지를 실제 DB 데이터와 연결했습니다.

추가한 서버 로직:
- `src/lib/my-page.ts`: 내 정보 요약, 내가 쓴 글, 내가 쓴 댓글 조회

화면 연결:
- `/me`: 내 이름, 이메일, 권한, 가입일, 작성 글 수, 댓글 수 표시
- `/me/posts`: 내가 작성한 게시글 목록 표시
- `/me/comments`: 내가 작성한 댓글 목록과 원문 게시글 링크 표시
- `/settings`: 현재 계정 정보 표시

현재 단계:
- 로그인한 사용자의 개인 활동 데이터를 DB에서 조회해 보여줍니다.
- 프로필 수정, 비밀번호 변경 같은 설정 변경 기능은 아직 구현하지 않았습니다.

## Account Settings

이 브랜치에서는 설정 페이지에서 실제 계정 관리 기능을 사용할 수 있게 했습니다.

추가한 API route:
- `PATCH /api/me/password`: 현재 비밀번호를 확인한 뒤 새 비밀번호로 변경
- `DELETE /api/me`: 비밀번호와 확인 문구를 검증한 뒤 회원 탈퇴 처리

추가한 화면 컴포넌트:
- `src/components/me/PasswordChangeForm.tsx`: 비밀번호 변경 폼
- `src/components/me/DeleteAccountForm.tsx`: 회원 탈퇴 폼

화면 연결:
- `/settings`: 계정 정보, 비밀번호 변경, 회원 탈퇴 영역 표시

주의:
- 회원 탈퇴 시 Prisma 관계 설정에 따라 사용자가 작성한 게시글과 댓글도 함께 삭제됩니다.
- 탈퇴가 성공하면 세션 쿠키를 삭제하고 회원가입 페이지로 이동합니다.

## RAG Foundation

이 브랜치에서는 RAG 기능의 기본 뼈대를 추가했습니다.

선택한 방향:
- Vector DB: PostgreSQL + pgvector
- Embedding 저장 위치: `post_embeddings` 테이블
- 추천 기능: 글 작성/수정 화면에서 비슷한 기존 게시글 찾기

추가한 DB 구조:
- `prisma/schema.prisma`: `PostEmbedding` 모델 추가
- `prisma/migrations/20260608090000_add_post_embeddings/migration.sql`: pgvector 확장과 `post_embeddings` 테이블 추가

추가한 서버 로직:
- `src/lib/rag.ts`: 게시글 텍스트를 임베딩으로 바꾸고 유사 게시글을 찾는 함수
- `POST /api/rag/similar-posts`: 제목/본문을 받아 유사 게시글 목록 반환

화면 연결:
- `src/components/posts/PostForm.tsx`: 글쓰기/수정 폼에 `비슷한 글 찾기` 버튼과 추천 결과 영역 추가
- `POST /api/posts`: 게시글 생성 후 임베딩 저장
- `PATCH /api/posts/[id]`: 게시글 수정 후 임베딩 갱신

현재 단계:
- 외부 LLM API 키 없이 구조를 먼저 이해할 수 있도록 개발용 로컬 임베딩을 사용합니다.
- 다음 단계에서 OpenAI Embedding 같은 상용 임베딩 모델로 `src/lib/rag.ts`의 임베딩 생성 부분을 교체하면 됩니다.

## Embedding Provider

이 브랜치에서는 RAG 임베딩 생성 방식을 provider 구조로 분리했습니다.

추가한 서버 로직:
- `src/lib/embedding-provider.ts`: `local`, `openai`, `auto` 임베딩 provider 선택
- `src/lib/rag.ts`: 직접 임베딩을 만들지 않고 `createEmbedding()`을 호출하도록 변경

환경변수:
- `EMBEDDING_PROVIDER=local`: 외부 API 없이 개발용 로컬 임베딩 사용
- `EMBEDDING_PROVIDER=openai`: OpenAI Embeddings API 사용
- `EMBEDDING_PROVIDER=auto`: `OPENAI_API_KEY`가 있으면 OpenAI, 없으면 local 사용
- `OPENAI_API_KEY`: OpenAI API 키
- `OPENAI_EMBEDDING_MODEL`: 기본값 `text-embedding-3-small`

현재 DB의 벡터 컬럼은 `vector(384)`입니다. OpenAI 임베딩을 사용할 때도 `dimensions: 384`로 요청해서 DB 차원과 맞춥니다.

주의:
- 이미 local 임베딩으로 저장된 게시글과 OpenAI 임베딩으로 새로 저장된 게시글을 섞으면 추천 품질이 떨어질 수 있습니다.
- provider를 바꾼 뒤에는 기존 게시글 임베딩을 다시 생성하는 작업이 필요합니다.
- 임베딩 저장에 실패해도 게시글 등록/수정 자체는 성공하도록 처리합니다. RAG는 보조 기능이므로 게시판 기본 기능을 막지 않습니다.
- DB 컨테이너를 새로 만들면 기존 브라우저 로그인 쿠키의 `userId`가 DB에 없을 수 있습니다. 작성 API는 DB에 실제 사용자가 없으면 세션 쿠키를 지우고 다시 로그인하라고 응답합니다.

## Post Detail Polish

이 브랜치에서는 게시글 상세 페이지를 Velog 상세 페이지처럼 읽기 중심 구조로 정리했습니다.

변경한 방향:
- 큰 페이지 헤더 대신 게시글 본문 안에서 제목, 작성자, 작성일, 댓글 수, 태그가 먼저 보이도록 배치
- 본문을 카드 안에 가두지 않고 중앙 정렬된 긴 글 레이아웃으로 표시
- 작성자 정보 영역과 이전글/다음글 이동 영역을 본문 아래에 배치
- 이전글 또는 다음글이 없으면 해당 링크를 표시하지 않음
- 댓글 영역을 본문 아래에 분리해서 글 읽기 흐름과 댓글 흐름을 구분
- 댓글 수정은 브라우저 prompt 대신 기존 댓글 문장 위치의 인라인 수정 폼으로 처리
- 기존 사이트의 색상, 버튼, 태그 스타일은 유지

관련 파일:
- `src/app/posts/[id]/page.tsx`
- `src/components/comments/CommentActions.tsx`
- `src/components/comments/CommentList.tsx`
- `src/app/globals.css`
- `src/lib/posts.ts`

## MCP Integration Planning

이 브랜치에서는 MCP 기능을 구현하기 전에 MCP 구조와 JSON-RPC 요청 흐름을 먼저 정리했습니다.

정리한 방향:
- MCP는 AI 애플리케이션이 외부 도구를 표준화된 방식으로 호출하기 위한 프로토콜입니다.
- MCP는 Host, Client, Server 역할로 나뉘며, 서버는 tools/resources/prompts 같은 기능을 제공합니다.
- MCP의 메시지 형식은 JSON-RPC 2.0을 기반으로 합니다.
- 이번 프로젝트의 1차 MCP 기능은 외부 날씨 데이터를 가져오는 tool로 시작합니다.

예상 연결 흐름:

```text
글쓰기 화면
  -> Next.js API Route
    -> MCP JSON-RPC request
      -> MCP Server
        -> 외부 날씨 API
      <- MCP JSON-RPC response
  <- 게시글 초안 또는 브리핑 데이터
```

현재 단계:
- 실제 MCP 서버 구현 전에 `initialize`, `tools/list`, `tools/call` 흐름을 문서로 정리했습니다.
- 외부 API 설정은 `.env`에서 서버 코드만 읽고, 브라우저에는 노출하지 않는 방향으로 관리합니다.
- 자세한 학습 노트는 `md/MCP.md`에 정리했습니다.

## MCP External API Strategy

이 브랜치에서는 1차 MCP 기능에서 사용할 외부 API와 API Key 관리 전략을 정리했습니다.

선택한 외부 API:
- Open-Meteo Weather Forecast API

선택 이유:
- 과제의 MCP 예시 중 "날씨 실시간 브리핑 글 작성"과 바로 연결됩니다.
- 현재 날씨 조회 결과를 게시글 초안이나 글쓰기 보조 문장으로 바꾸기 쉽습니다.
- 도시명 검색은 Open-Meteo Geocoding API로 좌표를 찾고, Weather Forecast API는 좌표 기반으로 호출할 수 있습니다.
- 기본 비상업적 API 흐름에서는 API Key 없이 바로 호출할 수 있어 개발과 시연이 쉽습니다.

사용할 환경변수:
- `OPEN_METEO_DEFAULT_LOCATION`: 기본 조회 지역 예시. 기본값 후보는 `Seoul`
- `OPEN_METEO_LANGUAGE`: 지오코딩 결과 언어. 한국어 결과를 위해 `ko`를 사용합니다.

관리 전략:
- Open-Meteo 기본 API는 API Key 없이 사용합니다.
- `.env.example`에는 기본 지역과 언어 설정만 둡니다.
- 브라우저 컴포넌트에서는 API Key를 직접 읽지 않습니다.
- 외부 API 호출은 MCP 서버 또는 Next.js 서버 코드에서만 수행합니다.
- 외부 API 호출에 실패해도 게시글 저장 같은 핵심 기능은 막지 않는 방향으로 처리합니다.

관련 공식 문서:
- Open-Meteo Weather Forecast API: https://open-meteo.com/en/docs
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api

## MCP Server Basic Structure

이 브랜치에서는 JSON-RPC 요청을 받을 수 있는 MCP 서버 기본 구조를 추가했습니다.

추가한 파일:
- `src/mcp/types.ts`: JSON-RPC 요청/응답 타입과 MCP tool 타입 정의
- `src/mcp/server.ts`: MCP method 분기 처리와 JSON-RPC 성공/에러 응답 생성
- `src/app/api/mcp/route.ts`: 브라우저나 서버에서 호출할 수 있는 Next.js API Route

현재 지원하는 method:
- `initialize`: MCP protocol version, server info, tools capability 반환
- `notifications/initialized`: 초기화 완료 notification 처리
- `tools/list`: 현재 등록된 MCP tool 목록 반환
- `tools/call`: 아직 구현되지 않은 tool에 대해 명확한 `Tool not found` 에러 반환

현재 단계:
- 실제 날씨 API tool은 아직 연결하지 않았습니다.
- 다음 작업에서 `tools` 목록에 `weather_current`를 추가하고, `tools/call`에서 Open-Meteo 호출로 연결합니다.

## MCP Weather Tool

이 브랜치에서는 MCP 서버에 실제 외부 날씨 데이터를 가져오는 `weather_current` tool을 연결했습니다.

추가한 파일:
- `src/mcp/tools/weather.ts`: Open-Meteo Geocoding API와 Weather Forecast API 호출 함수

변경한 파일:
- `src/mcp/server.ts`: `tools/list`에 `weather_current` 등록, `tools/call`에서 날씨 tool 실행

동작 흐름:

```text
tools/call weather_current
  -> location 입력값 확인
  -> Open-Meteo Geocoding API로 좌표 조회
  -> Open-Meteo Weather Forecast API로 현재 날씨 조회
  -> 게시글 초안에 쓸 수 있는 summary, draft, structuredContent 반환
```

에러 처리:
- 지역 입력값이 비어 있거나 너무 길면 `-32602` 에러를 반환합니다.
- 지역을 찾지 못하거나 Open-Meteo 호출에 실패해도 서버가 죽지 않고 JSON-RPC 에러 응답을 반환합니다.

## MCP Writing Flow

이 브랜치에서는 MCP 날씨 도구를 글쓰기 화면에 연결했습니다.

변경한 파일:
- `src/components/posts/PostForm.tsx`: 글쓰기/수정 폼에서 `/api/mcp`를 호출하는 날씨 브리핑 영역 추가
- `src/app/globals.css`: MCP 브리핑 입력과 결과 카드 스타일 추가

동작 흐름:

```text
글쓰기 화면
  -> 지역 입력
  -> 브리핑 추가 버튼 클릭
  -> POST /api/mcp
  -> tools/call weather_current
  -> 응답의 draft를 본문 textarea 끝에 추가
```

실패 처리:
- 외부 API 호출에 실패하면 글쓰기 기본 기능은 그대로 유지하고 MCP 영역에 오류 메시지만 표시합니다.
- MCP 응답 형식이 예상과 다르면 본문을 수정하지 않고 실패 메시지를 표시합니다.

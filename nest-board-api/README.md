# nest-board-api

NestJS 백엔드와 React 프론트엔드를 분리해서 구현하는 독립 게시판 프로젝트입니다.

## 목표

- NestJS로 게시판 API 서버를 구현합니다.
- React로 사용자가 보는 게시판 화면을 구현합니다.
- 이후 RAG, MCP, AI Agent 기능을 연결합니다.

## 백엔드 실행

NestJS 백엔드는 `backend` 폴더에서 실행합니다.

처음 한 번 의존성을 설치합니다.

```bash
cd nest-board-api/backend
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

기본 주소:

```text
http://localhost:3001
```

연결 확인 API:

```text
GET http://localhost:3001/health
```

## 현재 작업

### #29 NestJS 프로젝트 초기 설정 및 실행 흐름 정리

이번 작업에서는 `backend` 폴더에 NestJS 백엔드 기본 구조를 만들었습니다.

추가한 역할:

- `backend/src/main.ts`: NestJS 서버를 시작하는 진입점입니다.
- `backend/src/app.module.ts`: 앱의 최상위 모듈입니다.
- `backend/src/health/health.module.ts`: health 기능을 묶는 모듈입니다.
- `backend/src/health/health.controller.ts`: `GET /health` 요청을 받는 컨트롤러입니다.
- `backend/src/health/health.service.ts`: health 응답 데이터를 만드는 서비스입니다.
- `backend/.env.example`: 백엔드 포트와 프론트 CORS 주소 예시입니다.

현재 요청 흐름:

```text
React frontend
-> GET http://localhost:3001/health
-> HealthController
-> HealthService
-> JSON 응답
```

검증한 명령:

```bash
cd nest-board-api/backend
npm install
npm run build
```

`npm run build`가 통과하면 NestJS 코드가 TypeScript 기준으로 정상 컴파일된 것입니다.

이 구조를 기준으로 이후 인증, 게시글, 댓글, 태그 API를 모듈 단위로 추가합니다.

### #30 NestJS DB 연결 및 게시판 모델 설계

이번 작업에서는 NestJS 백엔드에 MariaDB + Prisma 기반 DB 연결 구조를 추가했습니다.

Prisma에서 MariaDB는 `provider = "mysql"` 설정을 사용합니다.

추가한 역할:

- `backend/prisma/schema.prisma`: 게시판 DB 모델을 정의합니다.
- `backend/prisma.config.ts`: Prisma CLI가 schema와 `DATABASE_URL`을 읽는 설정입니다.
- `backend/src/database/prisma.service.ts`: NestJS에서 Prisma Client를 사용할 수 있게 감싼 서비스입니다.
- `backend/src/database/database.module.ts`: PrismaService를 앱 전체에서 사용할 수 있게 등록하는 모듈입니다.
- `backend/src/health/health.controller.ts`: `GET /health/db` DB 연결 확인 API를 추가했습니다.
- `backend/.env.example`: `DATABASE_URL` 예시를 추가했습니다.

현재 설계한 DB 모델:

- `User`: 회원 정보와 비밀번호 해시를 저장합니다.
- `Post`: 게시글 제목, 내용, 작성자, 상태를 저장합니다.
- `Comment`: 게시글 댓글을 저장합니다.
- `Tag`: 태그 이름을 저장합니다.
- `PostTag`: 게시글과 태그의 다대다 관계를 연결합니다.

DB 관련 명령:

```bash
cd nest-board-api/backend
npm run db:generate
npm run db:migrate
npm run db:studio
```

명령 역할:

- `npm run db:generate`: Prisma schema를 기준으로 Prisma Client 타입을 생성합니다.
- `npm run db:migrate`: DB에 테이블 구조를 적용합니다.
- `npm run db:studio`: Prisma Studio로 DB 데이터를 확인합니다.

DB 연결 확인 API:

```text
GET http://localhost:3001/health/db
```

현재 DB 요청 흐름:

```text
GET /health/db
-> HealthController
-> HealthService
-> PrismaService
-> MariaDB
```

검증한 명령:

```bash
cd nest-board-api/backend
npm run db:generate
npx prisma validate
npm run build
```

실제 테이블 생성은 로컬 MariaDB 실행 후 `.env`에 `DATABASE_URL`을 설정하고 `npm run db:migrate`로 진행합니다.

### #31 NestJS 회원가입 로그인 API 구현

이번 작업에서는 NestJS 백엔드에 인증 API 구조를 추가했습니다.

추가한 역할:

- `backend/src/auth/auth.module.ts`: 인증 기능을 하나로 묶는 모듈입니다.
- `backend/src/auth/auth.controller.ts`: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` 요청을 받습니다.
- `backend/src/auth/auth.service.ts`: 회원가입, 로그인, 토큰 검증 로직을 처리합니다.
- `backend/src/auth/auth.guard.ts`: 보호 API에서 `Authorization: Bearer 토큰`을 검사합니다.
- `backend/src/auth/current-user.decorator.ts`: 컨트롤러에서 로그인 사용자를 쉽게 꺼낼 수 있게 합니다.
- `backend/src/auth/password.ts`: Node.js `crypto`의 `scrypt`로 비밀번호를 해시하고 검증합니다.
- `backend/src/auth/token.ts`: HMAC 기반 JWT access token을 만들고 검증합니다.
- `backend/src/auth/auth.dto.ts`: 회원가입/로그인 요청 body를 읽고 기본 검증합니다.
- `backend/src/auth/auth.types.ts`: 인증 사용자와 토큰 payload 타입을 관리합니다.
- `backend/.env.example`: `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS` 예시를 추가했습니다.

현재 인증 API:

```text
POST /auth/signup
POST /auth/login
GET /auth/me
POST /auth/logout
```

회원가입 요청 예시:

```json
{
  "email": "user@example.com",
  "name": "사용자",
  "password": "password123"
}
```

로그인 성공 응답은 다음 형태입니다.

```json
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "사용자",
    "role": "USER"
  }
}
```

보호 API 요청 흐름:

```text
React frontend
-> Authorization: Bearer accessToken
-> AuthGuard
-> AuthService.verifyToken()
-> request.user 저장
-> Controller에서 CurrentUser로 사용자 확인
```

로그아웃은 서버가 DB 세션을 지우는 방식이 아니라, 프론트엔드가 저장해둔 `accessToken`을 삭제하는 방식입니다.

검증한 명령:

```bash
cd nest-board-api/backend
npm run build
```

### #32 NestJS 게시글 CRUD API 구현

이번 작업에서는 NestJS 백엔드에 게시글 CRUD API 구조를 추가했습니다.

추가한 역할:

- `backend/src/posts/posts.module.ts`: 게시글 기능을 하나로 묶는 모듈입니다.
- `backend/src/posts/posts.controller.ts`: `POST /posts`, `GET /posts`, `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id` 요청을 받습니다.
- `backend/src/posts/posts.service.ts`: 게시글 생성, 목록 조회, 상세 조회, 수정, 삭제 로직을 처리합니다.
- `backend/src/posts/posts.dto.ts`: 게시글 생성/수정 요청 body를 읽고 기본 검증합니다.
- `backend/src/app.module.ts`: `PostsModule`을 앱에 연결했습니다.

현재 게시글 API:

```text
POST /posts
GET /posts
GET /posts/:id
PATCH /posts/:id
DELETE /posts/:id
```

게시글 생성 요청 예시:

```json
{
  "title": "첫 번째 게시글",
  "content": "게시글 내용입니다."
}
```

게시글 생성, 수정, 삭제는 로그인한 사용자만 사용할 수 있습니다.

보호 API 요청 흐름:

```text
React frontend
-> Authorization: Bearer accessToken
-> AuthGuard
-> CurrentUser
-> PostsController
-> PostsService
-> PrismaService
-> MariaDB
```

작성자 권한 확인:

```text
PATCH /posts/:id
DELETE /posts/:id
-> 기존 게시글의 authorId 조회
-> 로그인 사용자 id와 비교
-> 작성자가 아니면 403 에러
```

검증한 명령:

```bash
cd nest-board-api/backend
npm run build
```

### #33 NestJS 댓글 태그 검색 페이징 API 구현

이번 작업에서는 게시판 기본 요구사항 중 댓글, 태그, 검색, 페이징 API를 추가했습니다.

추가한 역할:

- `backend/src/comments/comments.module.ts`: 댓글 기능을 하나로 묶는 모듈입니다.
- `backend/src/comments/comments.controller.ts`: `POST /posts/:postId/comments`, `DELETE /comments/:id` 요청을 받습니다.
- `backend/src/comments/comments.service.ts`: 댓글 작성, 삭제, 권한 확인 로직을 처리합니다.
- `backend/src/comments/comments.dto.ts`: 댓글 작성 요청 body를 검증합니다.
- `backend/src/tags/tags.module.ts`: 태그 기능을 하나로 묶는 모듈입니다.
- `backend/src/tags/tags.controller.ts`: `GET /tags`, `GET /tags/:name/posts` 요청을 받습니다.
- `backend/src/tags/tags.service.ts`: 태그 목록과 태그별 게시글 조회를 처리합니다.
- `backend/src/posts/posts.dto.ts`: `tags`, `q`, `tag`, `page`, `pageSize` 입력 처리를 추가했습니다.
- `backend/src/posts/posts.service.ts`: 게시글 태그 연결, 검색, 태그 필터, 페이징을 추가했습니다.

현재 추가/확장된 API:

```text
POST /posts/:postId/comments
DELETE /comments/:id
GET /tags
GET /tags/:name/posts
GET /posts?q=검색어&tag=태그&page=1&pageSize=10
```

게시글 생성/수정 시 태그 연결 예시:

```json
{
  "title": "NestJS 게시글",
  "content": "게시글 내용입니다.",
  "tags": ["nestjs", "backend"]
}
```

검색/태그/페이징 요청 예시:

```text
GET /posts?q=nestjs&tag=backend&page=1&pageSize=10
```

댓글 작성과 삭제는 로그인한 사용자만 사용할 수 있습니다.

댓글 삭제 권한:

```text
댓글 작성자
게시글 작성자
ADMIN
```

검증한 명령:

```bash
cd nest-board-api/backend
npm run build
```

### #34 NestJS API 문서화 및 Next.js 구현과 비교 정리

이번 작업에서는 NestJS 백엔드 API 구조, 실행 명령, 주요 API 목록, Next.js API Route와의 차이를 정리했습니다.

현재 백엔드 폴더 구조:

```text
backend/src/main.ts
backend/src/app.module.ts
backend/src/database
backend/src/health
backend/src/auth
backend/src/posts
backend/src/comments
backend/src/tags
backend/prisma/schema.prisma
```

NestJS 요청 처리 흐름:

```text
HTTP 요청
-> Controller
-> Service
-> PrismaService
-> MariaDB
-> JSON 응답
```

예를 들어 게시글 생성 흐름은 다음과 같습니다.

```text
POST /posts
-> PostsController.create()
-> AuthGuard
-> CurrentUser
-> PostsService.create()
-> PrismaService.post.create()
-> MariaDB posts 테이블 저장
```

현재 주요 API:

```text
GET /health
GET /health/db

POST /auth/signup
POST /auth/login
GET /auth/me
POST /auth/logout

POST /posts
GET /posts
GET /posts/:id
PATCH /posts/:id
DELETE /posts/:id
GET /posts?q=검색어&tag=태그&page=1&pageSize=10

POST /posts/:postId/comments
DELETE /comments/:id

GET /tags
GET /tags/:name/posts
```

백엔드 실행 명령:

```bash
cd nest-board-api/backend
npm install
npm run dev
```

백엔드 종료:

```text
서버가 실행 중인 터미널에서 Ctrl + C
```

DB 관련 명령:

```bash
cd nest-board-api/backend
npm run db:generate
npm run db:migrate
npm run db:studio
```

Next.js API Route와 NestJS 구조 차이:

```text
Next.js API Route
-> app/api/posts/route.ts 같은 파일 위치가 API 주소가 됨
-> export async function GET, POST 같은 함수로 HTTP method 처리
-> 작은 기능을 빠르게 만들기 좋음

NestJS
-> Controller가 요청을 받음
-> Service가 실제 로직을 처리함
-> Module이 기능 단위를 묶음
-> 백엔드 API가 커질수록 역할 분리가 명확함
```

이번 NestJS 백엔드는 아래 기준으로 구현했습니다.

```text
Controller
요청을 받는 입구

Service
비즈니스 로직 처리

PrismaService
DB 연결 담당

Module
관련 Controller와 Service를 묶는 단위
```

자세한 학습용 문서는 `md/ISSUE_34_NEST_API_DOCUMENTATION.md`에 정리했습니다.

### #35 React 프론트엔드 프로젝트 초기 설정 및 화면 구조 설계

이번 작업에서는 `frontend` 폴더에 Vite 기반 React 프로젝트 구조를 만들었습니다.

추가한 역할:

- `frontend/src/App.tsx`: 전체 라우팅 구조를 관리합니다.
- `frontend/src/main.tsx`: React 앱을 브라우저에 렌더링하는 시작점입니다.
- `frontend/src/components`: 공통 UI 컴포넌트를 관리합니다.
- `frontend/src/pages`: 페이지 단위 화면을 관리합니다.
- `frontend/src/data/mockPosts.ts`: API 연결 전 화면 확인용 mock 데이터를 관리합니다.
- `frontend/src/styles.css`: Next.js 게시판에서 사용하던 스타일을 React 구조에 맞게 옮긴 CSS입니다.

현재 만든 페이지:

- `/`: 홈
- `/posts`: 게시글 목록
- `/posts/:id`: 게시글 상세
- `/posts/new`: 게시글 작성
- `/login`: 로그인
- `/signup`: 회원가입
- `/tags`: 태그

## 프론트엔드 실행

처음 한 번 의존성을 설치합니다.

```bash
cd nest-board-api/frontend
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

기본 주소:

```text
http://localhost:5173
```

## 앞으로 연결할 작업

- #36 React와 NestJS API 연결 구조 구현
- #37 React 인증 화면 및 로그인 상태 UI 구현
- #38 React 게시글 목록 상세 작성 수정 화면 구현
- #39 React 댓글 태그 검색 페이징 화면 구현

### #36 React와 NestJS API 연결 구조 구현

이번 작업에서는 React 화면에서 NestJS 백엔드 API를 호출하기 위한 기본 구조를 추가했습니다.

추가한 역할:

- `frontend/.env.example`: React에서 사용할 NestJS API 주소 예시입니다.
- `frontend/src/api/client.ts`: API base URL과 공통 `fetch` 요청 함수를 관리합니다.
- `frontend/src/api/health.ts`: NestJS `/health` API 호출 함수를 관리합니다.
- `frontend/src/types/api.ts`: API 응답 타입을 관리합니다.
- `frontend/src/components/BackendStatus.tsx`: 백엔드 연결 상태를 홈 화면에서 보여줍니다.

현재 기본 API 주소:

```text
http://localhost:3001
```

프론트엔드는 아래 환경변수로 백엔드 주소를 바꿀 수 있습니다.

```text
VITE_API_BASE_URL=http://localhost:3001
```

아직 NestJS 백엔드 서버가 없기 때문에 홈 화면의 연결 상태는 `연결 대기`로 보이는 것이 정상입니다.

나중에 NestJS에서 `GET /health` API를 만들면 이 영역이 `연결 완료`로 바뀝니다.

### #37 React 인증 화면 및 로그인 상태 UI 구현

이번 작업에서는 NestJS 인증 API가 만들어지기 전에 React 프론트엔드에서 로그인 상태 UI 흐름을 먼저 구현했습니다.

추가한 역할:

- `frontend/src/auth/AuthContext.tsx`: 임시 로그인 상태를 전역으로 관리합니다.
- `frontend/src/components/ProtectedRoute.tsx`: 로그인하지 않은 사용자를 로그인 페이지로 보냅니다.
- `frontend/src/pages/LoginPage.tsx`: 로그인 폼 제출 흐름을 처리합니다.
- `frontend/src/pages/SignupPage.tsx`: 회원가입 폼 제출 흐름을 처리합니다.
- `frontend/src/pages/MyPage.tsx`: 로그인한 사용자의 기본 정보를 보여줍니다.
- `frontend/src/components/SiteHeader.tsx`: 로그인 상태에 따라 로그인 버튼 또는 사용자 이름/로그아웃 버튼을 보여줍니다.

현재 인증 상태는 브라우저 `localStorage`에 임시로 저장합니다.

나중에 NestJS 인증 API가 완성되면 `AuthContext`의 `login`, `signup`, `logout` 내부를 실제 API 호출로 교체하면 됩니다.

### #38 React 게시글 목록 상세 작성 수정 화면 구현

이번 작업에서는 NestJS 게시글 API가 만들어지기 전에도 게시글 CRUD 화면 흐름을 확인할 수 있게 React 임시 게시글 저장소를 추가했습니다.

추가한 역할:

- `frontend/src/posts/PostContext.tsx`: 게시글 목록을 전역 상태와 `localStorage`로 관리합니다.
- `frontend/src/components/PostForm.tsx`: 작성과 수정에서 함께 쓰는 게시글 폼입니다.
- `frontend/src/pages/EditPostPage.tsx`: 게시글 수정 페이지입니다.
- `frontend/src/pages/NewPostPage.tsx`: 게시글 작성 후 상세 페이지로 이동합니다.
- `frontend/src/pages/PostDetailPage.tsx`: 작성자에게만 수정/삭제 버튼을 보여줍니다.
- `frontend/src/pages/PostsPage.tsx`: 임시 저장소의 게시글을 검색하고 태그로 필터링합니다.

현재 게시글은 브라우저 `localStorage`에 임시 저장됩니다.

나중에 NestJS 게시글 API가 완성되면 `PostContext`의 `createPost`, `updatePost`, `deletePost`, `getPostById` 흐름을 실제 API 호출로 교체하면 됩니다.

### #39 React 댓글 태그 검색 페이징 화면 구현

이번 작업에서는 게시글 상세와 목록 화면에서 댓글, 태그, 검색, 페이징 UI가 실제로 동작하도록 정리했습니다.

추가한 역할:

- `frontend/src/components/CommentSection.tsx`: 댓글 작성, 목록 표시, 삭제 UI를 관리합니다.
- `frontend/src/posts/PostContext.tsx`: 댓글 추가/삭제 함수와 댓글 개수를 관리합니다.
- `frontend/src/pages/PostDetailPage.tsx`: 댓글 섹션을 실제 게시글 데이터와 연결합니다.
- `frontend/src/pages/PostsPage.tsx`: 검색, 태그 필터, 페이지 이동을 함께 처리합니다.

현재 댓글과 게시글은 브라우저 `localStorage`에 임시 저장됩니다.

나중에 NestJS API가 완성되면 댓글 작성/삭제, 검색, 태그, 페이징 흐름을 API 호출로 교체합니다.

### #40 NestJS 독립 게시판 실행 문서 및 전체 흐름 정리

현재 프론트엔드는 React + Vite로 실행하고, 백엔드는 이후 NestJS 프로젝트를 추가해 별도 서버로 실행합니다.

현재 실행 가능한 서버:

```text
React 프론트엔드: http://localhost:5173
```

프론트엔드 실행:

```bash
cd nest-board-api/frontend
npm install
npm run dev
```

현재 준비된 프론트 흐름:

```text
index.html
-> src/main.tsx
-> AuthProvider
-> PostsProvider
-> App
-> React Router
-> Page 컴포넌트
```

현재 데이터 흐름:

```text
React 화면
-> AuthContext / PostContext
-> localStorage
```

나중에 NestJS API가 연결되면 바뀔 흐름:

```text
React 화면
-> api client
-> NestJS Controller
-> NestJS Service
-> DB
```

## Next.js 프론트 기능 복제 보강

Next.js 게시판에서 이미 만들었던 프론트 기능 중 React 버전에 부족했던 화면과 흐름을 보강했습니다.

추가/보강한 화면:

- `/me`: 내 정보와 활동 요약
- `/me/posts`: 내가 쓴 글
- `/me/comments`: 내 댓글
- `/settings`: 비밀번호 변경, 회원 탈퇴 UI
- `/notices`: 공지사항
- `/ai`: AI 도우미 준비 화면

추가/보강한 기능:

- 댓글 인라인 수정
- 게시글 상세의 이전글 / 다음글 이동
- 작성자 기준 내 글 / 내 댓글 필터링
- 회원 탈퇴 시 임시 저장소의 내 게시글과 댓글 정리

현재는 모두 React `localStorage` 기반 임시 흐름이며, 이후 NestJS API가 생기면 각 Context 내부를 API 호출로 교체합니다.

## React 프론트엔드 NestJS API 실제 연동

이번 작업에서는 React 프론트엔드의 임시 `localStorage` 흐름을 NestJS 백엔드 API 호출 흐름으로 교체했습니다.

작업 브랜치:

```text
feat/nest-board-api_frontend-api-integration
```

이번 작업은 별도 GitHub Issue 없이 진행했습니다.

변경한 역할:

- `frontend/src/api/client.ts`: 공통 API 요청 함수에 JWT access token 저장, 삭제, `Authorization` 헤더 처리를 추가했습니다.
- `frontend/src/auth/AuthContext.tsx`: 회원가입, 로그인, 내 정보 복원을 `/auth/signup`, `/auth/login`, `/auth/me` API로 연결했습니다.
- `frontend/src/posts/PostContext.tsx`: 게시글, 댓글, 태그, 검색, 페이징 데이터를 NestJS API에서 가져오도록 변경했습니다.
- `frontend/src/pages/LoginPage.tsx`: 로그인 폼 제출 시 실제 로그인 API를 호출합니다.
- `frontend/src/pages/SignupPage.tsx`: 회원가입 폼 제출 시 실제 회원가입 API를 호출합니다.
- `frontend/src/pages/PostsPage.tsx`: 검색어, 태그, 페이지 값을 `GET /posts` 쿼리스트링으로 전달합니다.
- `frontend/src/pages/PostDetailPage.tsx`: 상세 페이지 진입 시 `GET /posts/:id`로 최신 게시글과 댓글을 불러옵니다.
- `frontend/src/pages/EditPostPage.tsx`: 수정 페이지 직접 접근 시에도 `GET /posts/:id`로 게시글을 불러옵니다.
- `frontend/src/components/PostForm.tsx`: 게시글 작성과 수정을 `POST /posts`, `PATCH /posts/:id`로 연결했습니다.
- `frontend/src/components/CommentSection.tsx`: 댓글 작성, 수정, 삭제를 NestJS 댓글 API로 연결했습니다.
- `frontend/src/components/ProtectedRoute.tsx`: 새로고침 직후 토큰 복원 중에는 로그인 페이지로 바로 보내지 않고 확인 화면을 보여줍니다.
- `backend/src/comments`: React 댓글 인라인 수정 화면을 지원하기 위해 `PATCH /comments/:id` API를 추가했습니다.
- `backend/src/auth`: 비밀번호 변경과 회원 탈퇴를 위해 `PATCH /auth/password`, `DELETE /auth/me` API를 추가했습니다.

현재 프론트엔드 데이터 흐름:

```text
React Page / Component
-> AuthContext 또는 PostContext
-> apiRequest()
-> NestJS Controller
-> NestJS Service
-> PrismaService
-> MariaDB
```

로그인 성공 후 인증 요청 흐름:

```text
POST /auth/login
-> accessToken 저장
-> 이후 auth: true API 요청
-> Authorization: Bearer accessToken 헤더 자동 추가
```

현재 실제 API로 연결된 기능:

- 회원가입
- 로그인
- 새로고침 후 로그인 상태 복원
- 로그아웃
- 게시글 목록
- 게시글 상세
- 게시글 작성
- 게시글 수정
- 게시글 삭제
- 댓글 작성
- 댓글 수정
- 댓글 삭제
- 태그 목록
- 검색
- 태그 필터
- 페이징
- 비밀번호 변경
- 회원 탈퇴

계정 설정 API:

```text
PATCH /auth/password
DELETE /auth/me
```

비밀번호 변경은 현재 비밀번호를 검증한 뒤 새 비밀번호 해시로 교체합니다.

회원 탈퇴는 현재 이메일을 한 번 더 입력해 확인하고, 사용자 계정을 삭제합니다. DB 관계는 `onDelete: Cascade`로 설정되어 있어 해당 사용자의 게시글과 댓글도 함께 삭제됩니다.

검증한 명령:

```bash
cd nest-board-api/backend
npm run build

cd nest-board-api/frontend
npm run build
```

## 이전 결정 기록: 채용공고 기능 제거와 게시글 RAG 전환

이 문단은 이전 개편 과정에서 채용공고 기능을 잠시 제거했을 때의 기록입니다.
현재 기준은 문서 맨 아래의 `ChromaDB 2개 컬렉션과 사람인 공고 업데이트` 섹션을 따릅니다.

당시에는 채용공고 추천 기능을 사용하지 않기로 했습니다.

따라서 현재 코드 기준에서는 다음 기능이 제거되었습니다.

- `JobPosting` Prisma model
- `job_postings` MariaDB table
- MCP `job_sync` tool
- 사람인, 원티드, RemoteOK 채용공고 수집 코드
- 설정 페이지의 관리자 채용공고 업데이트 버튼

대신 ChromaDB는 게시글 RAG 검색 용도로 사용합니다.

```text
게시글 생성/수정
-> MariaDB posts 테이블에 원문 저장
-> ChromaDB board_posts collection에 게시글 임베딩 저장

게시글 삭제
-> MariaDB posts 테이블에서 삭제
-> ChromaDB board_posts collection에서도 같은 id 삭제

게시글 RAG 검색
-> GET /rag/posts/search?q=검색어
-> ChromaDB에서 비슷한 게시글 id 검색
-> MariaDB에서 실제 게시글 원문 조회
-> 검색 결과 반환
```

현재 ChromaDB 환경변수는 다음을 사용합니다.

```env
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
CHROMA_POST_COLLECTION=board_posts_openai
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

관리자 재색인 API는 다음과 같습니다.

```text
POST /rag/posts/reindex
```

이 API는 MariaDB에 있는 게시글을 다시 읽어서 ChromaDB `board_posts` collection에 넣습니다.

## 현재 기준: MCP 외부 API 도구 초기화

알바/채용공고 게시판 방향으로 다시 설계하기 위해, 이전에 실험용으로 붙였던 MCP 외부 자료 검색 도구들을 제거했습니다.

제거한 방향:

- Stack Overflow, GitHub, arXiv, Open-Meteo 등 외부 자료 검색 MCP tool 제거
- Wikipedia, Books, News, NASA, TMDB, OpenAQ, 환율, 코인, 주식, Naver 검색 도구 제거
- 게시글 상세 페이지의 `AI 자료 추천 댓글` 버튼 제거
- `/ai/posts/:postId/research-comment` API 제거
- `McpService`는 JSON-RPC 요청을 받는 기본 구조만 유지

현재 MCP는 다음 상태입니다.

```text
POST /mcp/json-rpc
-> AuthGuard
-> AdminGuard
-> McpController
-> McpService
-> 아직 등록된 tool 없음
```

앞으로 사람인 API를 붙일 때는 이 기본 구조에 새 tool을 추가하면 됩니다.

예상 방향:

```text
tool name: saramin_job_search
역할: 사람인 채용정보 API 호출
입력: keyword, location, page, limit
출력: 채용공고 목록
```

## 현재 기준: OpenAI 임베딩 적용

RAG 게시글 검색은 이제 직접 만든 로컬 임베딩이 아니라 OpenAI Embeddings API를 사용합니다.

기본 모델:

```env
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

실행 환경에는 다음 환경변수가 필요합니다.

```env
OPENAI_API_KEY=발급받은키
```

컬렉션 이름은 기존 로컬 임베딩과 충돌하지 않도록 새로 분리했습니다.

```env
CHROMA_POST_COLLECTION=board_posts_openai
```

현재 흐름:

```text
게시글 생성/수정
-> MariaDB에 원문 저장
-> OpenAI Embeddings API로 게시글 벡터 생성
-> ChromaDB board_posts_openai collection에 저장

게시글 검색
-> OpenAI Embeddings API로 검색어 벡터 생성
-> ChromaDB에서 비슷한 게시글 id 조회
-> MariaDB에서 실제 게시글 원문 조회
```

## V2 RAG 저장소 개편: MariaDB + ChromaDB

이번 V2 개편부터 RAG 저장소 역할을 분리합니다.

```text
MariaDB
- 회원
- 게시글
- 댓글
- 태그
- 채용공고 원본 데이터

ChromaDB
- 채용공고 임베딩 벡터
- 사용자 검색어와 비슷한 채용공고 검색

NestJS
- MariaDB 원본 데이터와 ChromaDB 검색 결과를 연결
```

기존에는 `JobPosting.embedding` JSON 컬럼에 임베딩을 저장하고 NestJS 코드에서 직접 유사도를 계산했습니다.
이제는 채용공고를 저장할 때 MariaDB에는 원본 데이터를 저장하고, ChromaDB에는 같은 `JobPosting.id`를 record id로 사용해서 임베딩 인덱스를 저장합니다.

공식 Chroma 문서 기준으로 Chroma는 별도 서버로 실행할 수 있고, TypeScript에서는 `ChromaClient`로 접속합니다. 또한 컬렉션에는 직접 계산한 `embeddings`와 `documents`, `metadatas`를 넣을 수 있습니다.

관련 공식 문서:

- [Chroma Client-Server Mode](https://docs.trychroma.com/docs/run-chroma/client-server)
- [Chroma TypeScript Client](https://docs.trychroma.com/reference/typescript/client)
- [Chroma Add Data](https://docs.trychroma.com/docs/collections/add-data)
- [Chroma Query and Get](https://docs.trychroma.com/docs/querying-collections/query-and-get)

### 추가된 파일과 역할

- `backend/src/rag/chroma-vector.service.ts`: ChromaDB 접속, collection 생성, 채용공고 벡터 저장, 검색, 삭제를 담당합니다.
- `backend/src/rag/rag.service.ts`: RAG 검색 시 먼저 ChromaDB에서 비슷한 채용공고 id를 찾고, MariaDB에서 원본 채용공고를 다시 조회합니다.
- `backend/src/rag/rag.controller.ts`: 관리자용 `POST /rag/job-postings/reindex` API를 추가했습니다.
- `docker-compose.yml`: MariaDB와 ChromaDB를 Docker로 함께 실행합니다.
- `backend/.env.example`: ChromaDB 접속 환경변수를 추가했습니다.
- `backend/package.json`: 로컬 Chroma 실행용 `npm run chroma` 스크립트를 추가했습니다.

### Docker로 MariaDB와 ChromaDB 실행

`nest-board-api` 폴더에서 실행합니다.

```bash
docker compose up -d mariadb chromadb
```

`backend/.env`의 `DATABASE_URL` 비밀번호가 `password`가 아니라면, Docker 실행 전에 같은 비밀번호를 환경변수로 맞춥니다.

```powershell
$env:MARIADB_ROOT_PASSWORD="backend .env의 DATABASE_URL 비밀번호"
docker compose up -d mariadb chromadb
```

상태 확인:

```bash
docker compose ps
```

종료:

```bash
docker compose down
```

데이터까지 완전히 삭제하고 싶을 때만 아래 명령어를 사용합니다.

```bash
docker compose down -v
```

### 백엔드 실행 순서

```bash
cd nest-board-api/backend
npm install
npm run db:generate
npm run db:migrate
npm run build
npm run dev
```

`.env`의 기본 예시는 다음 흐름을 기준으로 합니다.

```env
DATABASE_URL=mysql://root:password@localhost:3306/nest_ai_board
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
CHROMA_POST_COLLECTION=board_posts_openai
CHROMA_JOB_POSTING_COLLECTION=job_postings_openai
```

### RAG 검색 흐름

```text
사용자 검색어
-> RagController
-> RagService
-> ChromaVectorService.searchJobPostings()
-> ChromaDB에서 비슷한 채용공고 id 조회
-> MariaDB에서 해당 id의 원본 채용공고 조회
-> 프론트엔드에 검색 결과 반환
```

채용공고 동기화 흐름:

```text
관리자 MCP job_sync 실행
-> 외부 채용공고 수집
-> RagService.upsertJobPosting()
-> MariaDB에 원본 채용공고 저장
-> ChromaDB에 임베딩 벡터 upsert
```

기존 MariaDB 채용공고를 ChromaDB에 다시 넣고 싶을 때:

```text
POST /rag/job-postings/reindex
Authorization: Bearer 관리자_토큰
```

ChromaDB가 꺼져 있으면 개발 중 기능 확인을 위해 기존 방식처럼 MariaDB 데이터를 읽고 NestJS에서 직접 유사도를 계산하는 fallback 경로를 사용합니다. 다만 과제 설명에서는 ChromaDB를 RAG 검색 인덱스로 사용하는 구조가 핵심입니다.

## #45 AI Agent 자료 추천 댓글 구현

이번 작업에서는 사용자가 게시글 상세 페이지에서 버튼을 눌러 AI 자료 추천 댓글을 생성하는 Agent 흐름을 추가했습니다.

기존 채용공고 추천 흐름을 확장해서, Agent가 게시글 내용을 보고 필요한 MCP tool을 선택한 뒤 외부 API 결과를 RAG 점수로 정렬합니다.

RAG 점수, 사용한 tool, 수집 개수 같은 내부 처리 정보는 사용자 댓글에 노출하지 않습니다. 댓글에는 사용자가 바로 볼 수 있는 자료 제목, 출처, 내용 요약, `원문 보기` 링크만 보여줍니다.

지원하는 MCP tool:

```text
stackoverflow_search
-> Stack Exchange API로 비슷한 Stack Overflow 질문을 찾습니다.

github_repo_search
-> GitHub Search API로 참고할 만한 저장소를 찾습니다.

arxiv_paper_search
-> arXiv API로 관련 논문을 찾습니다.

weather_lookup
-> Open-Meteo API로 주요 지역 날씨를 조회합니다.

wikipedia_search
open_library_search
google_books_search
crossref_search
openalex_search
semantic_scholar_search
devto_search
hackernews_search
news_search
nasa_apod_search
tmdb_search
openaq_lookup
frankfurter_rates
coingecko_search
alpha_vantage_search
naver_search
```

총 20개 research tool을 `backend/src/mcp/research-tool-registry.ts`에 등록했습니다.

Agent는 게시글 자연어를 아래 기준으로 점수화하고 상위 3개 tool만 실행합니다.

```text
제목 keyword 매칭: +5
태그 keyword 매칭: +4
본문 keyword 매칭: +2
tool 설명과 게시글 단어 겹침: 추가 점수
매칭 keyword 개수: 소폭 추가 점수
```

API key가 필요한 tool은 `.env`에 key가 없으면 자동으로 후보에서 제외합니다.

야구, 축구, 농구, 스포츠 같은 일반 주제는 Wikipedia, News, Naver 계열 tool에 점수가 붙도록 보정했습니다. 아무 tool도 선택되지 않으면 기본으로 Wikipedia, Open Library, Google Books를 사용합니다.

추가한 역할:

- `backend/src/mcp/research-results.ts`: 외부 API 결과의 공통 타입을 정의합니다.
- `backend/src/mcp/research-tool-registry.ts`: 20개 tool 목록, 자연어 점수 계산, 상위 tool 선택을 관리합니다.
- `backend/src/mcp/stackoverflow-search.ts`: Stack Overflow 질문 검색 tool입니다.
- `backend/src/mcp/github-repo-search.ts`: GitHub 저장소 검색 tool입니다.
- `backend/src/mcp/arxiv-paper-search.ts`: arXiv 논문 검색 tool입니다.
- `backend/src/mcp/weather-lookup.ts`: Open-Meteo 날씨 조회 tool입니다.
- `backend/src/mcp/mcp.service.ts`: `job_sync` 외에 4개 research tool 호출을 지원합니다.
- `backend/src/ai/ai.controller.ts`: `POST /ai/posts/:postId/research-comment` 요청을 받습니다.
- `backend/src/ai/ai.service.ts`: 게시글 분석, MCP tool 선택, 외부 API 호출, RAG 정렬, AI 댓글 저장을 처리합니다.
- `frontend/src/posts/PostContext.tsx`: AI 자료 추천 댓글 생성 API를 호출하고 댓글 목록 상태를 갱신합니다.
- `frontend/src/pages/PostDetailPage.tsx`: 게시글 상세 페이지에 AI 자료 추천 댓글 버튼을 추가했습니다.
- `frontend/src/components/CommentSection.tsx`: AI 봇 댓글을 일반 댓글과 구분해서 표시합니다.

AI 자료 추천 댓글 생성 흐름:

```text
게시글 상세 페이지
-> AI 자료 추천 댓글 버튼 클릭
-> POST /ai/posts/:postId/research-comment
-> AuthGuard
-> AiController
-> AiService
-> 게시글 제목, 본문, 태그 분석
-> Agent가 MCP tool 선택
-> McpService가 외부 API 호출
-> 외부 결과와 게시글을 embedding
-> cosine similarity로 RAG 정렬
-> AI 자료 추천 봇 사용자 확인 또는 생성
-> Comment 테이블에 AI 댓글 저장
-> React 댓글 목록 갱신
```

AI 댓글 작성자:

```text
name: AI 자료 추천 봇
email: ai-research-bot@local
```

중복 생성 방지:

```text
같은 게시글에 이미 ai-research-bot@local 또는 ai-job-bot@local 댓글이 있으면 새 댓글을 만들지 않고 기존 댓글을 반환합니다.
```

Agent는 외부 LLM 호출 대신 규칙 기반으로 tool을 선택합니다.

나중에 상용 LLM을 붙일 때는 `backend/src/ai/ai.service.ts`의 `planTools()`와 댓글 본문 생성 부분을 LLM 호출로 교체하면 됩니다.

검증한 명령:

```bash
cd nest-board-api/backend
npm run build

cd nest-board-api/frontend
npm run build
```

## 내 글 스타일 분석 AI 구현

이번 작업에서는 마이페이지에서 로그인 사용자의 게시글과 댓글을 분석하는 `내 글 스타일 분석` 기능을 추가했습니다.

추가한 흐름:

```text
마이페이지
-> 내 글 스타일 알아보기 버튼 클릭
-> GET /ai/me/writing-style
-> AuthGuard
-> AiController
-> AiService
-> 로그인 사용자의 게시글/댓글 조회
-> 자주 쓰는 단어, 관심 태그, 질문형 비율, 기술 키워드 비율 계산
-> 마이페이지에 분석 리포트 표시
```

추가/수정한 역할:

- `backend/src/ai/ai.controller.ts`: `GET /ai/me/writing-style` 요청을 받습니다.
- `backend/src/ai/ai.service.ts`: 내 게시글과 댓글을 조회하고 글쓰기 스타일 리포트를 만듭니다.
- `frontend/src/pages/MyPage.tsx`: 마이페이지에 분석 버튼과 결과 UI를 추가했습니다.
- `frontend/src/styles.css`: 글 스타일 분석 카드와 반응형 레이아웃을 추가했습니다.

분석 항목:

```text
스타일 요약
분석한 글/댓글 수
질문형 문장 비율
기술 키워드 비율
자주 쓰는 단어
관심 태그
다음 글을 더 좋게 쓰는 방법
```

검증한 명령:

```bash
cd nest-board-api/backend
npm run build

cd nest-board-api/frontend
npm run build
```

## #43 RAG 채용공고 임베딩 검색 구현

이번 작업에서는 AI 채용공고 추천 댓글 기능의 RAG 기반 검색 구조를 추가했습니다.

RAG 검색 대상은 기존 게시글이 아니라 `JobPosting`에 저장된 채용공고입니다.

추가한 역할:

- `backend/prisma/schema.prisma`: `JobPostingStatus`, `JobPosting` 모델을 추가했습니다.
- `backend/prisma/migrations/20260612083000_add_job_postings/migration.sql`: 채용공고 저장 테이블 생성 마이그레이션입니다.
- `backend/src/rag/embedding.ts`: 채용공고와 사용자 글을 숫자 벡터로 바꾸고 cosine similarity를 계산합니다.
- `backend/src/rag/rag.dto.ts`: RAG 검색 쿼리 입력을 읽고 검증합니다.
- `backend/src/rag/rag.module.ts`: RAG 기능을 NestJS 모듈로 묶습니다.
- `backend/src/rag/rag.controller.ts`: `GET /rag/job-postings/search` 요청을 받습니다.
- `backend/src/rag/rag.service.ts`: 채용공고 upsert와 유사도 검색을 처리합니다.
- `backend/src/app.module.ts`: `RagModule`을 앱에 연결했습니다.

현재 RAG 검색 흐름:

```text
GET /rag/job-postings/search?q=nestjs backend junior
-> RagController
-> RagService
-> 사용자 검색어 임베딩
-> ACTIVE JobPosting 목록 조회
-> 채용공고 임베딩과 cosine similarity 비교
-> 점수가 높은 공고 순서로 반환
```

채용공고 저장 흐름:

```text
MCP 또는 관리자 공고 업데이트
-> RagService.upsertJobPosting()
-> source + externalId 기준 upsert
-> 채용공고 내용 임베딩
-> JobPosting 테이블 저장
```

1차 구현에서는 외부 API나 OpenAI Embedding API를 바로 붙이지 않고, 로컬 해시 기반 임베딩으로 구조를 먼저 만들었습니다.

나중에 실제 Embedding 모델을 붙일 때는 `backend/src/rag/embedding.ts`의 `createEmbedding()` 내부를 교체하면 됩니다.

검증한 명령:

```bash
cd nest-board-api/backend
npm run db:generate
npm run build
```

## #44 MCP 관리자 채용공고 업데이트 구현

이번 작업에서는 관리자가 설정 페이지에서 채용공고 업데이트를 실행하면 MCP JSON-RPC 흐름으로 채용공고를 가져와 DB에 저장하는 구조를 추가했습니다.

기본 provider는 `saramin`입니다. 사람인 공식 채용정보 API의 `access-key`가 있으면 실제 사람인 API를 호출하고, 키가 없으면 사람인 검색 링크 기반 fallback 데이터로 시연합니다.

네트워크나 외부 API 문제에 대비해 `wanted`, `remoteok`, `mock` provider도 함께 유지합니다.

추가한 역할:

- `backend/src/auth/admin.guard.ts`: `ADMIN` 권한 사용자만 접근할 수 있게 막는 Guard입니다.
- `backend/src/auth/auth.service.ts`: `.env`의 `ADMIN_EMAILS`에 포함된 이메일로 회원가입하면 `ADMIN` 권한을 부여합니다.
- `backend/src/mcp/mcp.controller.ts`: `POST /mcp/json-rpc` 요청을 받습니다.
- `backend/src/mcp/mcp.service.ts`: MCP JSON-RPC 요청을 해석하고 `job_sync` tool을 실행합니다.
- `backend/src/mcp/mcp.dto.ts`: JSON-RPC 요청과 tool call 입력을 검증합니다.
- `backend/src/mcp/mock-job-postings.ts`: 1차 구현용 mock 채용공고 데이터입니다.
- `backend/src/mcp/saramin-job-postings.ts`: 사람인 채용정보 API 응답 또는 fallback 데이터를 `JobPosting` 형태로 변환합니다.
- `backend/src/mcp/wanted-job-postings.ts`: 원티드 API 응답 또는 fallback 데이터를 `JobPosting` 형태로 변환합니다.
- `backend/src/mcp/remoteok-job-postings.ts`: RemoteOK 공개 API에서 원격 채용공고를 가져와 `JobPosting` 형태로 변환합니다.
- `backend/src/mcp/mcp.module.ts`: MCP 관련 Controller와 Service를 묶습니다.
- `backend/src/rag/rag.service.ts`: 마감일이 지난 ACTIVE 공고를 EXPIRED로 바꾸는 함수를 추가했습니다.
- `frontend/src/pages/SettingsPage.tsx`: 관리자에게만 채용공고 업데이트 버튼을 보여주고 MCP API를 호출합니다.

관리자 계정 설정:

```env
ADMIN_EMAILS=admin@example.com
JOB_PROVIDER=saramin
SARAMIN_ACCESS_KEY=
SARAMIN_API_URL=https://oapi.saramin.co.kr/job-search
SARAMIN_KEYWORDS=백엔드,프론트엔드,React,NestJS,TypeScript
SARAMIN_SYNC_LIMIT=30
WANTED_API_URL=
WANTED_API_KEY=
WANTED_SYNC_LIMIT=30
REMOTEOK_API_URL=https://remoteok.com/api
JOB_SYNC_LIMIT=30
```

`ADMIN_EMAILS`에 들어간 이메일로 회원가입하면 해당 사용자는 `ADMIN` 권한을 받습니다.

MCP 요청 예시:

```json
{
  "jsonrpc": "2.0",
  "id": "job-sync",
  "method": "tools/call",
  "params": {
    "name": "job_sync",
    "arguments": {
      "provider": "mock"
    }
  }
}
```

MCP 처리 흐름:

```text
관리자 설정 페이지
-> 채용공고 업데이트 버튼 클릭
-> POST /mcp/json-rpc
-> AuthGuard
-> AdminGuard
-> McpController
-> McpService
-> saramin job provider
-> RagService.upsertJobPosting()
-> JobPosting 테이블 저장
```

현재 지원 provider:

```text
saramin
wanted
remoteok
mock
```

`saramin`은 사람인 공식 채용정보 API의 `access-key`가 있으면 `https://oapi.saramin.co.kr/job-search`를 호출합니다. `SARAMIN_ACCESS_KEY`가 비어 있으면 무단 크롤링을 하지 않고 사람인 검색 링크 기반 fallback 데이터를 사용합니다.

`wanted`는 원티드 공식/제휴 API URL이 있으면 `WANTED_API_URL`을 호출합니다. URL이 비어 있으면 무단 크롤링 대신 원티드 검색 링크 기반 fallback 데이터를 사용합니다.

`remoteok`은 공개 원격 채용공고 API를 호출합니다.

`mock`은 네트워크 연결 없이 기능 시연을 해야 할 때 사용하는 fallback provider입니다.

검증한 명령:

```bash
cd nest-board-api/backend
npm run build

cd nest-board-api/frontend
npm run build
```
## 로컬 데모 데이터와 CORS

사람인형 홈 화면의 `section_banner.main_product` 영역을 실제 API 데이터로 확인하려면 데모 게시글을 넣을 수 있습니다.

```bash
cd nest-board-api/backend
npm run db:seed:demo
```

이 명령은 DB에 데모 작성자와 게시글을 직접 넣습니다. 글쓰기 API를 호출하지 않기 때문에 OpenAI 임베딩 비용은 발생하지 않습니다.

프론트 주소는 CORS 설정과 맞아야 합니다. 기본 예시는 다음 두 주소를 허용합니다.

```env
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

브라우저에서 `http://localhost:5173` 또는 `http://127.0.0.1:5173`로 접속하면 백엔드 `http://localhost:3001` API를 호출할 수 있습니다.

## 현재 기준: ChromaDB 2개 컬렉션과 사람인 공고 업데이트

이번 구조에서는 MariaDB와 ChromaDB의 역할을 분리합니다.

MariaDB는 원본 데이터를 저장합니다.

- `posts`: 사용자가 작성한 게시글 원본
- `job_postings`: 사람인 API에서 가져온 채용공고 원본

ChromaDB는 OpenAI 임베딩 벡터를 저장합니다.

- `board_posts_openai`: 게시글 임베딩 컬렉션
- `job_postings_openai`: 채용공고 임베딩 컬렉션

게시글 저장 흐름:

```text
프론트 글쓰기
-> POST /posts
-> PostsService.create()
-> MariaDB posts 저장
-> ChromaVectorService.upsertPostVector()
-> OpenAI Embeddings API로 게시글 임베딩 생성
-> ChromaDB board_posts_openai 컬렉션에 저장
```

채용공고 업데이트 흐름:

```text
관리자 설정 페이지
-> 사람인 공고 업데이트 버튼 클릭
-> POST /job-postings/saramin/sync
-> AuthGuard
-> AdminGuard
-> JobPostingsService.syncSaraminJobPostings()
-> 사람인 API에서 서울 개발자 신입/경력 공고 조회
-> MariaDB job_postings 저장 또는 갱신
-> OpenAI Embeddings API로 공고 임베딩 생성
-> ChromaDB job_postings_openai 컬렉션에 저장
```

필요한 환경변수:

```env
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
CHROMA_POST_COLLECTION=board_posts_openai
CHROMA_JOB_POSTING_COLLECTION=job_postings_openai

OPENAI_API_KEY=발급받은_OpenAI_키
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

SARAMIN_API_KEY=발급받은_사람인_키
SARAMIN_API_URL=https://oapi.saramin.co.kr/job-search
SARAMIN_DEVELOPER_KEYWORD=개발자
SARAMIN_SEOUL_LOCATION_CODE=101000
SARAMIN_FETCH_COUNT=20
```

관리자 버튼은 `ADMIN_EMAILS`에 등록된 이메일로 가입한 관리자 계정에서만 보입니다.

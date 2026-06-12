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

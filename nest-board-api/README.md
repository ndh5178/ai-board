# nest-board-api

NestJS 백엔드와 React 프론트엔드를 분리해서 구현하는 독립 게시판 프로젝트입니다.

## 목표

- NestJS로 게시판 API 서버를 구현합니다.
- React로 사용자가 보는 게시판 화면을 구현합니다.
- 이후 RAG, MCP, AI Agent 기능을 연결합니다.

## 현재 작업

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

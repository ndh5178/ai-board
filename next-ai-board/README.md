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

## Local Dev Scripts

Windows PowerShell에서 DB와 개발 서버를 한 번에 켜고 끄기 위한 스크립트입니다.

시작:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\next-ai-board
powershell -ExecutionPolicy Bypass -File .\dev-start.ps1
```

종료:

```powershell
cd C:\Users\user\Desktop\정글\ai-board\next-ai-board
powershell -ExecutionPolicy Bypass -File .\dev-stop.ps1
```

`dev-start.ps1`은 PostgreSQL Docker 컨테이너를 시작하거나 생성한 뒤 Prisma 마이그레이션을 실행하고 Next.js 개발 서버를 실행합니다.
`dev-stop.ps1`은 3000번 포트를 사용하는 Next.js 서버만 종료하고 PostgreSQL 컨테이너를 중지합니다.

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

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

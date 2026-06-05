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

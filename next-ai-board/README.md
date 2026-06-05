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

- [NEXTJS.md](./NEXTJS.md): Next.js를 배우면서 생긴 질문과 답

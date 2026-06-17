export const CAREER_TAG_NAME = "채용";

export const CAREER_KEYWORDS = [
  "취업",
  "채용",
  "공고",
  "지원",
  "이력서",
  "자소서",
  "포트폴리오",
  "면접",
  "서류",
  "합격",
  "불합격",
  "커리어",
  "신입",
  "주니어",
  "인턴",
  "개발자",
  "프론트엔드",
  "백엔드",
  "풀스택",
  "데이터",
  "데브옵스",
  "react",
  "typescript",
  "javascript",
  "node",
  "nestjs",
  "spring",
  "java",
  "python",
  "sql",
  "aws",
  "docker",
];

export function hasCareerKeywordText(...values: Array<string | null | undefined>) {
  const searchableText = values.filter(Boolean).join(" ").toLowerCase();

  return CAREER_KEYWORDS.some((keyword) => searchableText.includes(keyword));
}

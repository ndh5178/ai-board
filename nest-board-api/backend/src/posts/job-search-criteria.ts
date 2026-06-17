import type { JobSearchCriteria, JobSearchExperience } from "../job-postings/job-search.types";

type PostForCriteria = {
  content: string;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  title: string;
};

type RoleRule = {
  keywords: string[];
  role: string;
};

const DEFAULT_LOCATION = "서울";
const DEFAULT_EXPERIENCE: JobSearchExperience = "신입";
const RESULT_LIMIT = 3;

const ROLE_RULES: RoleRule[] = [
  {
    keywords: ["프론트엔드", "frontend", "front-end", "react", "vue", "next"],
    role: "프론트엔드",
  },
  {
    keywords: ["백엔드", "backend", "back-end", "spring", "nestjs", "node", "java"],
    role: "백엔드",
  },
  {
    keywords: ["데이터", "data", "sql", "python", "etl"],
    role: "데이터",
  },
  {
    keywords: ["풀스택", "fullstack", "full-stack"],
    role: "풀스택",
  },
];

const SKILL_RULES = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "NestJS",
  "Spring",
  "Java",
  "Python",
  "SQL",
  "AWS",
  "Docker",
];

const LOCATION_RULES = ["서울", "강남", "판교", "성남", "경기", "원격", "재택"];

export function buildJobSearchCriteriaAttempts(post: PostForCriteria) {
  const criteria = extractJobSearchCriteria(post);
  const primarySkill = criteria.skills[0];
  const primaryRole = criteria.roles[0];
  const attempts: JobSearchCriteria[] = [criteria];

  if (primarySkill && primaryRole) {
    attempts.push({
      ...criteria,
      keyword: compactKeyword([primarySkill, primaryRole, criteria.experience]),
      skills: [primarySkill],
    });
  }

  if (primaryRole) {
    attempts.push({
      ...criteria,
      keyword: compactKeyword([primaryRole, criteria.experience]),
      skills: [],
    });
  }

  attempts.push({
    experience: DEFAULT_EXPERIENCE,
    keyword: "개발자 신입",
    limit: RESULT_LIMIT,
    roles: ["개발자"],
    skills: [],
  });

  return uniqueCriteria(attempts).slice(0, 4);
}

export function extractJobSearchCriteria(post: PostForCriteria): JobSearchCriteria {
  const text = buildSearchableText(post);
  const roles = extractRoles(text);
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const location = extractLocation(text);
  const keyword = compactKeyword([...skills.slice(0, 2), roles[0] ?? "개발자", experience]);

  return {
    experience,
    keyword,
    limit: RESULT_LIMIT,
    location,
    roles,
    skills,
  };
}

function buildSearchableText(post: PostForCriteria) {
  return [post.title, post.content, ...post.tags.map((tagLink) => tagLink.tag.name)].filter(Boolean).join(" ");
}

function extractRoles(text: string) {
  const normalizedText = text.toLowerCase();
  const roles = ROLE_RULES.filter((rule) =>
    rule.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase())),
  ).map((rule) => rule.role);

  return [...new Set(roles.length > 0 ? roles : ["개발자"])];
}

function extractSkills(text: string) {
  const normalizedText = text.toLowerCase();

  return SKILL_RULES.filter((skill) => normalizedText.includes(skill.toLowerCase()));
}

function extractExperience(text: string): JobSearchExperience {
  const normalizedText = text.toLowerCase();

  if (/(경력|4년|5년|6년|7년|8년|9년|10년)/.test(normalizedText)) {
    return "경력";
  }

  if (/(신입|인턴|주니어|1년차|2년차|3년차)/.test(normalizedText)) {
    return "신입";
  }

  return "무관";
}

function extractLocation(text: string) {
  return LOCATION_RULES.find((location) => text.includes(location)) ?? DEFAULT_LOCATION;
}

function compactKeyword(values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function uniqueCriteria(criteriaList: JobSearchCriteria[]) {
  const seen = new Set<string>();

  return criteriaList.filter((criteria) => {
    const key = `${criteria.keyword}|${criteria.location ?? ""}|${criteria.experience ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

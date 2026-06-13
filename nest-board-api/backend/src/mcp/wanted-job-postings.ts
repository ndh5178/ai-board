import type { UpsertJobPostingInput } from "../rag/rag.service";

type WantedApiJob = {
  company?: unknown;
  companyName?: unknown;
  deadline?: unknown;
  description?: unknown;
  externalId?: unknown;
  id?: unknown;
  location?: unknown;
  position?: unknown;
  skills?: unknown;
  tags?: unknown;
  title?: unknown;
  url?: unknown;
};

type WantedApiResponse = {
  data?: unknown;
  jobs?: unknown;
  positions?: unknown;
};

const DEFAULT_WANTED_SYNC_LIMIT = 30;
const MAX_WANTED_SYNC_LIMIT = 50;

export async function fetchWantedJobPostings(): Promise<UpsertJobPostingInput[]> {
  if (!process.env.WANTED_API_URL) {
    return listWantedFallbackJobPostings();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const headers = new Headers({
      Accept: "application/json",
      "User-Agent": "nest-ai-board/0.1 contact=local",
    });

    if (process.env.WANTED_API_KEY) {
      headers.set("Authorization", `Bearer ${process.env.WANTED_API_KEY}`);
    }

    const response = await fetch(process.env.WANTED_API_URL, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Wanted API 요청에 실패했습니다. (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    const jobs = readWantedJobs(payload);

    return jobs
      .map(toJobPostingInput)
      .filter((jobPosting): jobPosting is UpsertJobPostingInput => Boolean(jobPosting))
      .slice(0, readWantedSyncLimit());
  } finally {
    clearTimeout(timeout);
  }
}

function readWantedJobs(payload: unknown): WantedApiJob[] {
  if (Array.isArray(payload)) {
    return payload.filter(isWantedApiJob);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as WantedApiResponse;
  const candidates = [response.data, response.jobs, response.positions];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isWantedApiJob);
    }
  }

  return [];
}

function isWantedApiJob(value: unknown): value is WantedApiJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const job = value as WantedApiJob;

  return Boolean(readString(job.id) || readString(job.externalId)) && Boolean(readString(job.title) || readString(job.position));
}

function toJobPostingInput(job: WantedApiJob): UpsertJobPostingInput | null {
  const externalId = readString(job.externalId) ?? readString(job.id);
  const title = readString(job.title) ?? readString(job.position);

  if (!externalId || !title) {
    return null;
  }

  return {
    company: readString(job.companyName) ?? readString(job.company) ?? "회사명 미공개",
    deadline: readDeadline(job.deadline),
    description: stripHtml(readString(job.description) ?? title),
    experience: inferExperience(`${title} ${readString(job.description) ?? ""}`),
    externalId,
    location: readString(job.location) ?? "지역 정보 없음",
    skills: readSkills(job.skills ?? job.tags),
    source: "wanted",
    title,
    url: readString(job.url) ?? `https://www.wanted.co.kr/search?query=${encodeURIComponent(title)}`,
  };
}

function listWantedFallbackJobPostings(): UpsertJobPostingInput[] {
  return [
    {
      company: "원티드 예시 기업 A",
      deadline: new Date("2026-09-30T14:59:59.000Z"),
      description:
        "TypeScript, NestJS, Prisma를 활용해 채용 플랫폼 백엔드 API와 MariaDB 기반 서비스를 개발할 주니어 개발자를 찾습니다.",
      experience: "신입/주니어",
      externalId: "wanted-fallback-nest-backend",
      location: "서울",
      skills: ["TypeScript", "NestJS", "Prisma", "MariaDB"],
      source: "wanted",
      title: "주니어 백엔드 개발자",
      url: "https://www.wanted.co.kr/search?query=NestJS%20%EB%B0%B1%EC%97%94%EB%93%9C",
    },
    {
      company: "원티드 예시 기업 B",
      deadline: new Date("2026-10-31T14:59:59.000Z"),
      description:
        "React와 TypeScript 기반 화면 개발, REST API 연동, 사용자 경험 개선에 관심 있는 신입 프론트엔드 개발자를 모집합니다.",
      experience: "신입",
      externalId: "wanted-fallback-react-frontend",
      location: "서울 / 원격 협의",
      skills: ["React", "TypeScript", "Vite", "API 연동"],
      source: "wanted",
      title: "신입 프론트엔드 개발자",
      url: "https://www.wanted.co.kr/search?query=React%20%EC%8B%A0%EC%9E%85",
    },
    {
      company: "원티드 예시 기업 C",
      deadline: new Date("2026-11-30T14:59:59.000Z"),
      description:
        "RAG, MCP, AI Agent를 활용한 AI 웹 서비스와 추천 시스템을 함께 만들어갈 주니어 풀스택 개발자를 찾습니다.",
      experience: "주니어",
      externalId: "wanted-fallback-ai-fullstack",
      location: "판교",
      skills: ["RAG", "MCP", "AI Agent", "React", "NestJS"],
      source: "wanted",
      title: "AI 서비스 풀스택 개발자",
      url: "https://www.wanted.co.kr/search?query=AI%20%ED%92%80%EC%8A%A4%ED%83%9D",
    },
  ];
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readDeadline(value: unknown) {
  const rawValue = readString(value);

  if (!rawValue) {
    return null;
  }

  const deadline = new Date(rawValue);

  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

function readSkills(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(readString)
    .filter((skill): skill is string => Boolean(skill))
    .slice(0, 12);
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function inferExperience(text: string) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("시니어") || lowerText.includes("senior") || lowerText.includes("lead")) {
    return "시니어";
  }

  if (lowerText.includes("신입") || lowerText.includes("주니어") || lowerText.includes("intern") || lowerText.includes("junior")) {
    return "신입/주니어";
  }

  return "경력 무관";
}

function readWantedSyncLimit() {
  const limit = Number(process.env.WANTED_SYNC_LIMIT ?? process.env.JOB_SYNC_LIMIT ?? DEFAULT_WANTED_SYNC_LIMIT);

  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_WANTED_SYNC_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_WANTED_SYNC_LIMIT);
}

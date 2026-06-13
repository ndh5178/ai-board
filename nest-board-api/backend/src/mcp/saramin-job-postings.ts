import type { UpsertJobPostingInput } from "../rag/rag.service";

type SaraminJob = {
  active?: unknown;
  company?: {
    detail?: {
      name?: unknown;
    };
    name?: unknown;
  };
  id?: unknown;
  keyword?: unknown;
  position?: {
    "experience-level"?: {
      name?: unknown;
    };
    "job-code"?: {
      name?: unknown;
    };
    "job-mid-code"?: {
      name?: unknown;
    };
    "job-type"?: {
      name?: unknown;
    };
    location?: {
      name?: unknown;
    };
    title?: unknown;
  };
  "expiration-timestamp"?: unknown;
  "expiration-date"?: unknown;
  url?: unknown;
};

type SaraminApiResponse = {
  jobs?: {
    job?: unknown;
  };
};

const DEFAULT_SARAMIN_API_URL = "https://oapi.saramin.co.kr/job-search";
const DEFAULT_SARAMIN_SYNC_LIMIT = 30;
const MAX_SARAMIN_SYNC_LIMIT = 110;

export async function fetchSaraminJobPostings(): Promise<UpsertJobPostingInput[]> {
  if (!process.env.SARAMIN_ACCESS_KEY) {
    return listSaraminFallbackJobPostings();
  }

  const url = buildSaraminUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "nest-ai-board/0.1 contact=local",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`사람인 API 요청에 실패했습니다. (${response.status})`);
    }

    const payload = (await response.json()) as SaraminApiResponse;
    const jobs = readSaraminJobs(payload);

    return jobs
      .filter((job) => Number(job.active ?? 1) === 1)
      .map(toJobPostingInput)
      .filter((jobPosting): jobPosting is UpsertJobPostingInput => Boolean(jobPosting))
      .slice(0, readSaraminSyncLimit());
  } finally {
    clearTimeout(timeout);
  }
}

function buildSaraminUrl() {
  const url = new URL(process.env.SARAMIN_API_URL ?? DEFAULT_SARAMIN_API_URL);
  url.searchParams.set("access-key", process.env.SARAMIN_ACCESS_KEY ?? "");
  url.searchParams.set("keywords", process.env.SARAMIN_KEYWORDS ?? "백엔드,프론트엔드,React,NestJS,TypeScript");
  url.searchParams.set("count", String(readSaraminSyncLimit()));
  url.searchParams.set("start", "0");
  url.searchParams.set("sort", "pd");
  url.searchParams.set("fields", "expiration-date");

  return url;
}

function readSaraminJobs(payload: SaraminApiResponse) {
  const jobs = payload.jobs?.job;

  if (Array.isArray(jobs)) {
    return jobs.filter(isSaraminJob);
  }

  if (isSaraminJob(jobs)) {
    return [jobs];
  }

  return [];
}

function isSaraminJob(value: unknown): value is SaraminJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const job = value as SaraminJob;

  return Boolean(readString(job.id)) && Boolean(readString(job.position?.title));
}

function toJobPostingInput(job: SaraminJob): UpsertJobPostingInput | null {
  const externalId = readString(job.id);
  const title = readString(job.position?.title);
  const url = readString(job.url);

  if (!externalId || !title || !url) {
    return null;
  }

  const skills = readSkills(job.keyword);
  const jobCategory = readString(job.position?.["job-code"]?.name) ?? readString(job.position?.["job-mid-code"]?.name);
  const jobType = readString(job.position?.["job-type"]?.name);

  return {
    company: readString(job.company?.detail?.name) ?? readString(job.company?.name) ?? "회사명 미공개",
    deadline: readDeadline(job["expiration-timestamp"], job["expiration-date"]),
    description: [title, jobCategory, jobType, ...skills].filter(Boolean).join(" "),
    experience: readString(job.position?.["experience-level"]?.name) ?? "경력 정보 없음",
    externalId,
    location: readString(job.position?.location?.name) ?? "지역 정보 없음",
    skills,
    source: "saramin",
    title,
    url,
  };
}

function listSaraminFallbackJobPostings(): UpsertJobPostingInput[] {
  return [
    {
      company: "사람인 예시 기업 A",
      deadline: new Date("2026-09-30T14:59:59.000Z"),
      description:
        "NestJS, TypeScript, Prisma, MariaDB 기반 REST API 개발 경험이 있는 신입/주니어 백엔드 개발자를 찾습니다.",
      experience: "신입/주니어",
      externalId: "saramin-fallback-nest-backend",
      location: "서울 > 강남구",
      skills: ["NestJS", "TypeScript", "Prisma", "MariaDB", "REST API"],
      source: "saramin",
      title: "신입 백엔드 개발자",
      url: "https://www.saramin.co.kr/zf_user/search?searchword=NestJS%20%EB%B0%B1%EC%97%94%EB%93%9C",
    },
    {
      company: "사람인 예시 기업 B",
      deadline: new Date("2026-10-31T14:59:59.000Z"),
      description:
        "React와 TypeScript로 사용자 화면을 개발하고 백엔드 API와 연동할 프론트엔드 신입 개발자를 모집합니다.",
      experience: "신입",
      externalId: "saramin-fallback-react-frontend",
      location: "경기 > 성남시 분당구",
      skills: ["React", "TypeScript", "Vite", "API 연동"],
      source: "saramin",
      title: "React 프론트엔드 개발자",
      url: "https://www.saramin.co.kr/zf_user/search?searchword=React%20%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C",
    },
    {
      company: "사람인 예시 기업 C",
      deadline: new Date("2026-11-30T14:59:59.000Z"),
      description:
        "RAG, MCP, AI Agent를 활용한 AI 웹 애플리케이션을 개발할 주니어 풀스택 개발자를 찾습니다.",
      experience: "주니어",
      externalId: "saramin-fallback-ai-fullstack",
      location: "서울 > 송파구",
      skills: ["RAG", "MCP", "AI Agent", "React", "NestJS"],
      source: "saramin",
      title: "AI 서비스 풀스택 개발자",
      url: "https://www.saramin.co.kr/zf_user/search?searchword=AI%20%ED%92%80%EC%8A%A4%ED%83%9D",
    },
  ];
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readSkills(value: unknown) {
  const keyword = readString(value);

  if (!keyword) {
    return [];
  }

  return keyword
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function readDeadline(timestamp: unknown, date: unknown) {
  const rawTimestamp = Number(timestamp);

  if (Number.isFinite(rawTimestamp) && rawTimestamp > 0) {
    return new Date(rawTimestamp * 1000);
  }

  const rawDate = readString(date);

  if (!rawDate) {
    return null;
  }

  const deadline = new Date(rawDate);

  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

function readSaraminSyncLimit() {
  const limit = Number(process.env.SARAMIN_SYNC_LIMIT ?? process.env.JOB_SYNC_LIMIT ?? DEFAULT_SARAMIN_SYNC_LIMIT);

  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_SARAMIN_SYNC_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_SARAMIN_SYNC_LIMIT);
}

import type { UpsertJobPostingInput } from "../rag/rag.service";

type RemoteOkJob = {
  company?: unknown;
  date?: unknown;
  description?: unknown;
  id?: unknown;
  location?: unknown;
  position?: unknown;
  slug?: unknown;
  tags?: unknown;
  url?: unknown;
};

const DEFAULT_REMOTEOK_API_URL = "https://remoteok.com/api";
const DEFAULT_SYNC_LIMIT = 30;
const MAX_SYNC_LIMIT = 50;

export async function fetchRemoteOkJobPostings(): Promise<UpsertJobPostingInput[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(process.env.REMOTEOK_API_URL ?? DEFAULT_REMOTEOK_API_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "nest-ai-board/0.1 contact=local",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`RemoteOK API 요청에 실패했습니다. (${response.status})`);
    }

    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload)) {
      throw new Error("RemoteOK API 응답 형식이 배열이 아닙니다.");
    }

    return payload
      .filter(isRemoteOkJob)
      .map(toJobPostingInput)
      .filter((jobPosting): jobPosting is UpsertJobPostingInput => Boolean(jobPosting))
      .slice(0, readSyncLimit());
  } finally {
    clearTimeout(timeout);
  }
}

function isRemoteOkJob(value: unknown): value is RemoteOkJob {
  if (!value || typeof value !== "object") {
    return false;
  }

  const job = value as RemoteOkJob;

  return Boolean(readString(job.id) || readString(job.slug)) && Boolean(readString(job.position));
}

function toJobPostingInput(job: RemoteOkJob): UpsertJobPostingInput | null {
  const title = readString(job.position);
  const externalId = readString(job.id) ?? readString(job.slug);
  const url = readString(job.url);

  if (!title || !externalId || !url) {
    return null;
  }

  const description = stripHtml(readString(job.description) ?? title);
  const skills = readSkills(job.tags);

  return {
    company: readString(job.company) ?? "회사명 미공개",
    deadline: null,
    description,
    experience: inferExperience(`${title} ${description}`),
    externalId,
    location: readString(job.location) ?? "Remote",
    skills,
    source: "remoteok",
    title,
    url,
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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

  if (lowerText.includes("senior") || lowerText.includes("lead") || lowerText.includes("principal")) {
    return "시니어";
  }

  if (lowerText.includes("junior") || lowerText.includes("entry") || lowerText.includes("intern")) {
    return "신입/주니어";
  }

  return "경력 무관";
}

function readSyncLimit() {
  const limit = Number(process.env.JOB_SYNC_LIMIT ?? DEFAULT_SYNC_LIMIT);

  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_SYNC_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_SYNC_LIMIT);
}

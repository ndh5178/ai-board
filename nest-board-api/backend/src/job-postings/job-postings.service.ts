import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ChromaVectorService } from "../rag/chroma-vector.service";

const SARAMIN_SOURCE = "saramin";
const DEFAULT_SARAMIN_API_URL = "https://oapi.saramin.co.kr/job-search";
const DEFAULT_SEOUL_LOCATION_CODE = "101000";
const DEFAULT_DEVELOPER_KEYWORD = "개발자";
const TARGET_EXPERIENCES = ["신입", "경력"] as const;

type SaraminJob = Record<string, unknown>;

type SaraminResponse = {
  jobs?: {
    job?: SaraminJob | SaraminJob[];
  };
};

type NormalizedJobPosting = {
  company: string;
  deadline: Date | null;
  description: string;
  experience: string;
  externalId: string;
  location: string;
  skills: string[];
  title: string;
  url: string;
};

@Injectable()
export class JobPostingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaVectorService: ChromaVectorService,
  ) {}

  async syncSaraminJobPostings() {
    const apiKey = process.env.SARAMIN_API_KEY;

    if (!apiKey) {
      throw new BadRequestException("SARAMIN_API_KEY 환경변수가 설정되어 있지 않습니다.");
    }

    const fetchedAt = new Date();
    const normalizedJobs = new Map<string, NormalizedJobPosting>();

    for (const experience of TARGET_EXPERIENCES) {
      const jobs = await this.fetchSaraminJobs(apiKey, experience);

      for (const job of jobs) {
        const normalized = this.normalizeSaraminJob(job, experience);

        if (normalized) {
          normalizedJobs.set(normalized.externalId, normalized);
        }
      }
    }

    let savedCount = 0;
    let indexedCount = 0;

    for (const job of normalizedJobs.values()) {
      const savedJob = await this.prisma.jobPosting.upsert({
        create: {
          company: job.company,
          deadline: job.deadline,
          description: job.description,
          experience: job.experience,
          externalId: job.externalId,
          lastFetchedAt: fetchedAt,
          location: job.location,
          skills: job.skills,
          source: SARAMIN_SOURCE,
          status: "ACTIVE",
          title: job.title,
          url: job.url,
        },
        update: {
          company: job.company,
          deadline: job.deadline,
          description: job.description,
          experience: job.experience,
          lastFetchedAt: fetchedAt,
          location: job.location,
          skills: job.skills,
          status: "ACTIVE",
          title: job.title,
          url: job.url,
        },
        where: {
          source_externalId: {
            externalId: job.externalId,
            source: SARAMIN_SOURCE,
          },
        },
      });
      savedCount += 1;

      await this.chromaVectorService.upsertJobPosting({
        company: savedJob.company,
        description: savedJob.description,
        experience: savedJob.experience,
        id: savedJob.id,
        location: savedJob.location,
        skills: this.readSkills(savedJob.skills),
        source: savedJob.source,
        status: savedJob.status,
        title: savedJob.title,
        url: savedJob.url,
      });
      indexedCount += 1;
    }

    return {
      fetchedCount: normalizedJobs.size,
      indexedCount,
      savedCount,
      source: SARAMIN_SOURCE,
    };
  }

  private async fetchSaraminJobs(apiKey: string, experience: (typeof TARGET_EXPERIENCES)[number]) {
    const url = new URL(process.env.SARAMIN_API_URL ?? DEFAULT_SARAMIN_API_URL);
    const keyword = `${process.env.SARAMIN_DEVELOPER_KEYWORD ?? DEFAULT_DEVELOPER_KEYWORD} ${experience}`;

    url.searchParams.set("access-key", apiKey);
    url.searchParams.set("keywords", keyword);
    url.searchParams.set("loc_cd", process.env.SARAMIN_SEOUL_LOCATION_CODE ?? DEFAULT_SEOUL_LOCATION_CODE);
    url.searchParams.set("count", process.env.SARAMIN_FETCH_COUNT ?? "20");
    url.searchParams.set("start", "0");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`사람인 API 요청에 실패했습니다. (${response.status})`);
    }

    const payload = (await response.json().catch(() => ({}))) as SaraminResponse;
    const rawJobs = payload.jobs?.job;

    if (!rawJobs) {
      return [];
    }

    return Array.isArray(rawJobs) ? rawJobs : [rawJobs];
  }

  private normalizeSaraminJob(
    job: SaraminJob,
    requestedExperience: (typeof TARGET_EXPERIENCES)[number],
  ): NormalizedJobPosting | null {
    const position = this.readRecord(job.position);
    const companyRecord = this.readRecord(job.company);
    const companyDetail = this.readRecord(companyRecord?.detail);
    const externalId = this.readString(job.id ?? job["job-id"] ?? job["posting-id"]);
    const title = this.readString(position?.title ?? job.title);
    const company = this.readString(companyDetail?.name ?? companyRecord?.name ?? job.company);
    const url = this.readString(job.url ?? job["job-url"]);

    if (!externalId || !title || !company || !url) {
      return null;
    }

    const locationRecord = this.readRecord(position?.location);
    const experienceRecord = this.readRecord(position?.["experience-level"]);
    const jobTypeRecord = this.readRecord(position?.["job-type"]);
    const industryRecord = this.readRecord(position?.industry);
    const deadline = this.readDeadline(job["expiration-timestamp"] ?? job.expirationTimestamp ?? job.deadline);
    const skills = this.readSkillsFromKeyword(job.keyword);
    const location = this.readString(locationRecord?.name) || "서울";
    const experience = this.readString(experienceRecord?.name) || requestedExperience;
    const description = [
      title,
      company,
      location,
      experience,
      this.readString(jobTypeRecord?.name),
      this.readString(industryRecord?.name),
      ...skills,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      company,
      deadline,
      description,
      experience,
      externalId,
      location,
      skills,
      title,
      url,
    };
  }

  private readRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private readSkillsFromKeyword(value: unknown) {
    return this.readString(value)
      .split(/[,\s]+/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  private readSkills(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string");
  }

  private readDeadline(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Date(value * 1000);
    }

    if (typeof value === "string" && value.trim()) {
      const numericValue = Number(value);

      if (Number.isFinite(numericValue)) {
        return new Date(numericValue * 1000);
      }

      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }
}

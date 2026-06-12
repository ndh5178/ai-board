import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { cosineSimilarity, createEmbedding, readEmbedding } from "./embedding";
import { readSearchJobPostingsQuery, type SearchJobPostingsQuery } from "./rag.dto";

export type UpsertJobPostingInput = {
  company: string;
  deadline?: Date | null;
  description: string;
  experience?: string | null;
  externalId: string;
  location?: string | null;
  skills?: string[];
  source: string;
  title: string;
  url: string;
};

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService) {}

  async searchJobPostings(query: SearchJobPostingsQuery = {}) {
    const input = readSearchJobPostingsQuery(query);
    const queryEmbedding = createEmbedding(input.q);
    const jobPostings = await this.prisma.jobPosting.findMany({
      orderBy: {
        lastFetchedAt: "desc",
      },
      select: {
        company: true,
        deadline: true,
        description: true,
        experience: true,
        id: true,
        location: true,
        skills: true,
        source: true,
        title: true,
        url: true,
        embedding: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    const matches = jobPostings
      .map((jobPosting) => {
        const score = cosineSimilarity(queryEmbedding, readEmbedding(jobPosting.embedding));

        return {
          jobPosting: {
            company: jobPosting.company,
            deadline: jobPosting.deadline,
            description: jobPosting.description,
            experience: jobPosting.experience,
            id: jobPosting.id,
            location: jobPosting.location,
            skills: jobPosting.skills,
            source: jobPosting.source,
            title: jobPosting.title,
            url: jobPosting.url,
          },
          score,
        };
      })
      .filter((match) => match.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit);

    return {
      matches,
      query: input.q,
      totalCount: matches.length,
    };
  }

  async upsertJobPosting(input: UpsertJobPostingInput) {
    const embedding = createEmbedding(this.buildJobPostingText(input));
    const deadline = input.deadline ?? null;
    const status = deadline && deadline.getTime() < Date.now() ? "EXPIRED" : "ACTIVE";

    return this.prisma.jobPosting.upsert({
      create: {
        company: input.company,
        deadline,
        description: input.description,
        embedding: embedding as Prisma.InputJsonValue,
        experience: input.experience ?? null,
        externalId: input.externalId,
        lastFetchedAt: new Date(),
        location: input.location ?? null,
        skills: (input.skills ?? []) as Prisma.InputJsonValue,
        source: input.source,
        status,
        title: input.title,
        url: input.url,
      },
      update: {
        company: input.company,
        deadline,
        description: input.description,
        embedding: embedding as Prisma.InputJsonValue,
        experience: input.experience ?? null,
        lastFetchedAt: new Date(),
        location: input.location ?? null,
        skills: (input.skills ?? []) as Prisma.InputJsonValue,
        status,
        title: input.title,
        url: input.url,
      },
      where: {
        source_externalId: {
          externalId: input.externalId,
          source: input.source,
        },
      },
    });
  }

  private buildJobPostingText(input: UpsertJobPostingInput) {
    return [
      input.title,
      input.company,
      input.location,
      input.experience,
      ...(input.skills ?? []),
      input.description,
    ]
      .filter(Boolean)
      .join(" ");
  }
}

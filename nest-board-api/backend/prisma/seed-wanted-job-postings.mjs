import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { ChromaClient } from "chromadb";

const WANTED_FALLBACK_SOURCE = "wanted-fallback";
const DEFAULT_SEED_PATH = join(process.cwd(), "prisma", "seeds", "wanted-job-postings.seed.json");
const DEFAULT_CHROMA_HOST = "localhost";
const DEFAULT_CHROMA_PORT = 8000;
const DEFAULT_JOB_COLLECTION_NAME = "job_postings_openai";
const DEFAULT_OPENAI_EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readSkills(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function readDeadline(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeSeedJob(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const externalId = readString(item.externalId);
  const source = readString(item.source);
  const title = readString(item.title);
  const company = readString(item.company);
  const url = readString(item.url);

  if (source !== WANTED_FALLBACK_SOURCE || !externalId || !title || !company || !url) {
    return null;
  }

  const skills = readSkills(item.skills);
  const location = readString(item.location) || "국내";
  const experience = readString(item.experience) || "신입·주니어";
  const description =
    readString(item.description) || [title, company, location, experience, ...skills].filter(Boolean).join(" ");

  return {
    company,
    deadline: readDeadline(item.deadline),
    description,
    experience,
    externalId,
    location,
    skills,
    title,
    url,
  };
}

async function readSeedJobs() {
  const seedPath = process.env.WANTED_FALLBACK_SEED_PATH ?? DEFAULT_SEED_PATH;
  const seedText = await readFile(seedPath, "utf8");
  const payload = JSON.parse(seedText);

  if (!Array.isArray(payload)) {
    throw new Error("Wanted fallback seed must be a JSON array.");
  }

  return payload
    .slice(0, 50)
    .map(normalizeSeedJob)
    .filter(Boolean);
}

function buildJobPostingText(job) {
  return [job.title, job.company, job.location, job.experience, ...job.skills, job.description]
    .filter(Boolean)
    .join(" ");
}

async function createEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for ChromaDB indexing.");
  }

  const response = await fetch(process.env.OPENAI_EMBEDDING_API_URL ?? DEFAULT_OPENAI_EMBEDDING_API_URL, {
    body: JSON.stringify({
      input: text,
      model: process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_OPENAI_EMBEDDING_MODEL,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `OpenAI embedding request failed. (${response.status})`);
  }

  const embedding = payload?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embedding response did not include an embedding array.");
  }

  return embedding.filter((item) => typeof item === "number" && Number.isFinite(item));
}

async function createJobCollection() {
  const client = new ChromaClient({
    host: process.env.CHROMA_HOST ?? DEFAULT_CHROMA_HOST,
    port: Number(process.env.CHROMA_PORT ?? DEFAULT_CHROMA_PORT),
    ssl: process.env.CHROMA_SSL === "true",
  });

  return client.getOrCreateCollection({
    configuration: {
      hnsw: {
        space: "cosine",
      },
    },
    embeddingFunction: null,
    metadata: {
      description: "RAG search index for fallback job postings stored in MariaDB",
      embedding: process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_OPENAI_EMBEDDING_MODEL,
    },
    name: process.env.CHROMA_JOB_POSTING_COLLECTION ?? DEFAULT_JOB_COLLECTION_NAME,
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });
  const jobs = await readSeedJobs();
  const fetchedAt = new Date();
  let collection = null;
  let indexedCount = 0;
  let indexFailedCount = 0;
  let savedCount = 0;

  try {
    collection = await createJobCollection();
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "ChromaDB collection is not available.");
  }

  try {
    await prisma.jobPosting.updateMany({
      data: {
        status: "HIDDEN",
      },
      where: {
        externalId: {
          notIn: jobs.map((job) => job.externalId),
        },
        source: WANTED_FALLBACK_SOURCE,
      },
    });

    for (const job of jobs) {
      const savedJob = await prisma.jobPosting.upsert({
        create: {
          company: job.company,
          deadline: job.deadline,
          description: job.description,
          experience: job.experience,
          externalId: job.externalId,
          lastFetchedAt: fetchedAt,
          location: job.location,
          skills: job.skills,
          source: WANTED_FALLBACK_SOURCE,
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
            source: WANTED_FALLBACK_SOURCE,
          },
        },
      });
      savedCount += 1;

      if (!collection) {
        indexFailedCount += 1;
        continue;
      }

      try {
        const document = buildJobPostingText(job);
        await collection.upsert({
          documents: [document],
          embeddings: [await createEmbedding(document)],
          ids: [savedJob.id],
          metadatas: [
            {
              company: savedJob.company,
              experience: savedJob.experience,
              location: savedJob.location,
              source: savedJob.source,
              status: savedJob.status,
              tags: job.skills.join(","),
              title: savedJob.title,
              url: savedJob.url,
            },
          ],
        });
        indexedCount += 1;
      } catch (error) {
        indexFailedCount += 1;
        console.warn(
          `[index skipped] ${savedJob.title}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }

    console.log(
      `Wanted fallback seed complete. saved=${savedCount}, indexed=${indexedCount}, indexFailed=${indexFailedCount}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

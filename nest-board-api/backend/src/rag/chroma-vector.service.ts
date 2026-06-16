import { Injectable } from "@nestjs/common";
import { ChromaClient, type Collection, type Metadata } from "chromadb";
import { createEmbedding } from "./embedding";

const DEFAULT_CHROMA_HOST = "localhost";
const DEFAULT_CHROMA_PORT = 8000;
const DEFAULT_POST_COLLECTION_NAME = "board_posts_openai";
const DEFAULT_JOB_COLLECTION_NAME = "job_postings_openai";

export type PostVectorInput = {
  authorName?: string | null;
  content: string;
  id: string;
  status: string;
  tags?: string[];
  title: string;
};

export type PostVectorMatch = {
  id: string;
  score: number;
};

export type JobPostingVectorInput = {
  company: string;
  description: string;
  experience?: string | null;
  id: string;
  location?: string | null;
  skills?: string[];
  source: string;
  status: string;
  title: string;
  url: string;
};

export type JobPostingVectorMatch = {
  id: string;
  score: number;
};

@Injectable()
export class ChromaVectorService {
  private readonly client: ChromaClient;
  private readonly postCollectionName = process.env.CHROMA_POST_COLLECTION ?? DEFAULT_POST_COLLECTION_NAME;
  private readonly jobPostingCollectionName =
    process.env.CHROMA_JOB_POSTING_COLLECTION ?? DEFAULT_JOB_COLLECTION_NAME;
  private postCollectionPromise: Promise<Collection> | null = null;
  private jobPostingCollectionPromise: Promise<Collection> | null = null;

  constructor() {
    this.client = new ChromaClient({
      host: process.env.CHROMA_HOST ?? DEFAULT_CHROMA_HOST,
      port: Number(process.env.CHROMA_PORT ?? DEFAULT_CHROMA_PORT),
      ssl: process.env.CHROMA_SSL === "true",
    });
  }

  async searchPosts(query: string, limit: number): Promise<PostVectorMatch[]> {
    const collection = await this.getPostCollection();
    const queryEmbedding = await createEmbedding(query);
    const result = await collection.query({
      include: ["distances"],
      nResults: limit,
      queryEmbeddings: [queryEmbedding],
      where: {
        status: "PUBLISHED",
      },
    });

    return (
      result.rows()[0]?.map((row) => ({
        id: row.id,
        score: this.distanceToScore(row.distance),
      })) ?? []
    );
  }

  async upsertPost(input: PostVectorInput) {
    const collection = await this.getPostCollection();
    const document = this.buildPostText(input);

    await collection.upsert({
      documents: [document],
      embeddings: [await createEmbedding(document)],
      ids: [input.id],
      metadatas: [this.buildMetadata(input)],
    });
  }

  async deletePost(id: string) {
    const collection = await this.getPostCollection();

    await collection.delete({
      ids: [id],
    });
  }

  buildPostText(input: Pick<PostVectorInput, "authorName" | "content" | "tags" | "title">) {
    return [input.title, input.authorName, ...(input.tags ?? []), input.content].filter(Boolean).join(" ");
  }

  async upsertJobPosting(input: JobPostingVectorInput) {
    const collection = await this.getJobPostingCollection();
    const document = this.buildJobPostingText(input);

    await collection.upsert({
      documents: [document],
      embeddings: [await createEmbedding(document)],
      ids: [input.id],
      metadatas: [this.buildJobPostingMetadata(input)],
    });
  }

  async searchJobPostings(query: string, limit: number): Promise<JobPostingVectorMatch[]> {
    const collection = await this.getJobPostingCollection();
    const queryEmbedding = await createEmbedding(query);
    const result = await collection.query({
      include: ["distances"],
      nResults: limit,
      queryEmbeddings: [queryEmbedding],
      where: {
        status: "ACTIVE",
      },
    });

    return (
      result.rows()[0]?.map((row) => ({
        id: row.id,
        score: this.distanceToScore(row.distance),
      })) ?? []
    );
  }

  buildJobPostingText(
    input: Pick<
      JobPostingVectorInput,
      "company" | "description" | "experience" | "location" | "skills" | "title"
    >,
  ) {
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

  private getPostCollection() {
    this.postCollectionPromise ??= this.client.getOrCreateCollection({
      configuration: {
        hnsw: {
          space: "cosine",
        },
      },
      embeddingFunction: null,
      metadata: {
        description: "RAG search index for board posts stored in MariaDB",
        embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      },
      name: this.postCollectionName,
    });

    return this.postCollectionPromise;
  }

  private getJobPostingCollection() {
    this.jobPostingCollectionPromise ??= this.client.getOrCreateCollection({
      configuration: {
        hnsw: {
          space: "cosine",
        },
      },
      embeddingFunction: null,
      metadata: {
        description: "RAG search index for job postings stored in MariaDB",
        embedding: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      },
      name: this.jobPostingCollectionName,
    });

    return this.jobPostingCollectionPromise;
  }

  private buildMetadata(input: PostVectorInput): Metadata {
    return {
      authorName: input.authorName ?? null,
      status: input.status,
      tags: (input.tags ?? []).join(","),
      title: input.title,
    };
  }

  private buildJobPostingMetadata(input: JobPostingVectorInput): Metadata {
    return {
      company: input.company,
      experience: input.experience ?? null,
      location: input.location ?? null,
      source: input.source,
      status: input.status,
      tags: (input.skills ?? []).join(","),
      title: input.title,
      url: input.url,
    };
  }

  private distanceToScore(distance?: number | null) {
    if (typeof distance !== "number" || !Number.isFinite(distance)) {
      return 0;
    }

    return Number(Math.max(0, 1 - distance).toFixed(6));
  }
}

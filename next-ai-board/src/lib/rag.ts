import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { SimilarPost } from "@/types/rag";

export const EMBEDDING_DIMENSION = 384;
const MAX_SOURCE_TEXT_LENGTH = 4000;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildEmbeddingSource(title: string, content: string) {
  return normalizeText(`${title} ${title} ${content}`).slice(
    0,
    MAX_SOURCE_TEXT_LENGTH,
  );
}

function hashToken(token: string) {
  const digest = createHash("sha256").update(token).digest();
  return {
    index: digest.readUInt32BE(0) % EMBEDDING_DIMENSION,
    sign: digest[4] % 2 === 0 ? 1 : -1,
  };
}

export function createLocalEmbedding(text: string) {
  const vector = Array.from({ length: EMBEDDING_DIMENSION }, () => 0);
  const tokens = normalizeText(text)
    .toLowerCase()
    .split(/[^0-9a-zA-Z가-힣]+/)
    .filter(Boolean);

  for (const token of tokens) {
    const { index, sign } = hashToken(token);
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function toVectorLiteral(vector: number[]) {
  return `[${vector.map((value) => value.toFixed(6)).join(",")}]`;
}

export async function syncPostEmbedding({
  postId,
  title,
  content,
}: {
  postId: string;
  title: string;
  content: string;
}) {
  const sourceText = buildEmbeddingSource(title, content);
  const embedding = toVectorLiteral(createLocalEmbedding(sourceText));

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "post_embeddings" ("postId", "embedding", "sourceText", "updatedAt")
      VALUES ($1, $2::vector, $3, now())
      ON CONFLICT ("postId")
      DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "sourceText" = EXCLUDED."sourceText",
        "updatedAt" = now()
    `,
    postId,
    embedding,
    sourceText,
  );
}

export async function findSimilarPosts({
  title,
  content,
  excludePostId,
  limit = 3,
}: {
  title: string;
  content: string;
  excludePostId?: string;
  limit?: number;
}) {
  const sourceText = buildEmbeddingSource(title, content);
  const embedding = toVectorLiteral(createLocalEmbedding(sourceText));
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      excerpt: string | null;
      authorName: string;
      createdAt: Date;
      similarity: number;
    }>
  >(
    `
      SELECT
        p.id,
        p.title,
        p.excerpt,
        u.name AS "authorName",
        p."createdAt",
        1 - (pe.embedding <=> $1::vector) AS similarity
      FROM "post_embeddings" pe
      JOIN "posts" p ON p.id = pe."postId"
      JOIN "users" u ON u.id = p."authorId"
      WHERE p.status = 'PUBLISHED'
        AND ($2::text IS NULL OR p.id <> $2::text)
      ORDER BY pe.embedding <=> $1::vector
      LIMIT $3
    `,
    embedding,
    excludePostId ?? null,
    limit,
  );

  return rows.map<SimilarPost>((row) => ({
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    similarity: Math.max(0, Math.min(1, Number(row.similarity))),
  }));
}

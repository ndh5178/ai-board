import { createHash } from "crypto";

export const EMBEDDING_DIMENSION = 384;

type EmbeddingProvider = "auto" | "local" | "openai";

type OpenAIEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
  error?: {
    message?: string;
  };
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getEmbeddingProvider() {
  const provider = (process.env.EMBEDDING_PROVIDER ?? "auto").toLowerCase();

  if (provider === "openai" || provider === "local" || provider === "auto") {
    return provider as EmbeddingProvider;
  }

  return "auto";
}

function hashToken(token: string) {
  const digest = createHash("sha256").update(token).digest();
  return {
    index: digest.readUInt32BE(0) % EMBEDDING_DIMENSION,
    sign: digest[4] % 2 === 0 ? 1 : -1,
  };
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
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

  return normalizeVector(vector);
}

async function createOpenAIEmbedding(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dimensions: EMBEDDING_DIMENSION,
      encoding_format: "float",
      input: text,
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    }),
  });
  const result = (await response.json().catch(() => null)) as
    | OpenAIEmbeddingResponse
    | null;

  if (!response.ok) {
    throw new Error(
      result?.error?.message ?? "OpenAI embedding request failed.",
    );
  }

  const embedding = result?.data?.[0]?.embedding;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error("OpenAI embedding response has an invalid dimension.");
  }

  return embedding;
}

export async function createEmbedding(text: string) {
  const provider = getEmbeddingProvider();

  if (provider === "local") {
    return createLocalEmbedding(text);
  }

  if (provider === "openai") {
    return createOpenAIEmbedding(text);
  }

  if (process.env.OPENAI_API_KEY) {
    return createOpenAIEmbedding(text);
  }

  return createLocalEmbedding(text);
}

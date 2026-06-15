const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_OPENAI_EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings";

export type EmbeddingVector = number[];

type OpenAiEmbeddingResponse = {
  data?: Array<{
    embedding?: unknown;
  }>;
  error?: {
    message?: string;
  };
};

export async function createEmbedding(text: string): Promise<EmbeddingVector> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.");
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
  const payload = (await response.json().catch(() => ({}))) as OpenAiEmbeddingResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI 임베딩 요청에 실패했습니다. (${response.status})`);
  }

  return readEmbedding(payload.data?.[0]?.embedding);
}

export function cosineSimilarity(left: EmbeddingVector, right: EmbeddingVector) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftSize = 0;
  let rightSize = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftSize += left[index] * left[index];
    rightSize += right[index] * right[index];
  }

  if (leftSize === 0 || rightSize === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftSize) * Math.sqrt(rightSize));
}

export function readEmbedding(value: unknown): EmbeddingVector {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
}

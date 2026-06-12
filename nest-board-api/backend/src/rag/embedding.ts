const EMBEDDING_DIMENSION = 64;

export type EmbeddingVector = number[];

export function createEmbedding(text: string): EmbeddingVector {
  const vector = Array.from({ length: EMBEDDING_DIMENSION }, () => 0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const index = hashToken(token) % EMBEDDING_DIMENSION;
    vector[index] += 1;
  }

  return normalizeVector(vector);
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

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function hashToken(token: string) {
  let hash = 0;

  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function normalizeVector(vector: EmbeddingVector) {
  const size = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (size === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / size).toFixed(6)));
}

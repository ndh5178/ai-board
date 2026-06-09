-- Enable pgvector for RAG-style similarity search.
CREATE EXTENSION IF NOT EXISTS vector;

-- Store one embedding per post. The vector dimension matches src/lib/rag.ts.
CREATE TABLE "post_embeddings" (
    "postId" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "sourceText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_embeddings_pkey" PRIMARY KEY ("postId")
);

-- Cosine distance index for nearest-neighbor lookup.
CREATE INDEX "post_embeddings_embedding_idx" ON "post_embeddings"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

ALTER TABLE "post_embeddings" ADD CONSTRAINT "post_embeddings_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

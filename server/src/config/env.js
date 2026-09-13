import 'dotenv/config';

function parseNumberEnv(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: process.env.PORT || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqChatModel: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b',
  // Groq has no embeddings endpoint, so embeddings run locally via @huggingface/transformers.
  embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
  dbPath: process.env.DB_PATH || './data/knowledge.db',
  // Retrieval tuning (Step 4) - see README "Retrieval" section for caveats.
  topK: parseNumberEnv(process.env.TOP_K, 5),
  similarityThreshold: parseNumberEnv(process.env.SIMILARITY_THRESHOLD, 0.3),
};

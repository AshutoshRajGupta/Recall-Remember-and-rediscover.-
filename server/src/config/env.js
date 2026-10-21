import "dotenv/config";

function parseNumberEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: process.env.PORT || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  groqApiKey: process.env.GROQ_API_KEY || "",
  groqChatModel: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b",

  // Local embedding model
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",

  // Neon PostgreSQL
  databaseUrl: process.env.DATABASE_URL || "",

  // Retrieval configuration
  topK: parseNumberEnv(process.env.TOP_K, 5),
  similarityThreshold: parseNumberEnv(process.env.SIMILARITY_THRESHOLD, 0.3),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};

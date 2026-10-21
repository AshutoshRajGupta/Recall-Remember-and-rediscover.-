import { createHash } from "node:crypto";
import { redisClient, connectRedis } from "../config/redis.js";

const CACHE_TTL_SECONDS = 60 * 15;
const CACHE_VERSION = "v2";
const REVISION_TTL_SECONDS = 60 * 60 * 24 * 365;

function normalizeQuestion(question) {
  return question.trim().toLowerCase();
}

function createQuestionHash(question) {
  return createHash("sha256").update(normalizeQuestion(question)).digest("hex");
}

async function getUserRevision(userId) {
  const key = `rag:${CACHE_VERSION}:revision:user:${userId}`;

  // Initialize the revision once; don't reset an existing revision.
  await redisClient.set(key, "1", { NX: true });
  await redisClient.expire(key, REVISION_TTL_SECONDS);

  return (await redisClient.get(key)) || "1";
}

export async function getCachedAnswer(userId, question) {
  try {
    await connectRedis();

    const revision = await getUserRevision(userId);
    const questionHash = createQuestionHash(question);
    const key = `rag:${CACHE_VERSION}:user:${userId}:rev:${revision}:${questionHash}`;

    const cached = await redisClient.get(key);

    if (!cached) {
      console.log("[cache] RAG cache miss");
      return null;
    }

    console.log("[cache] RAG cache hit");

    try {
      return JSON.parse(cached);
    } catch {
      await redisClient.del(key);
      return null;
    }
  } catch (err) {
    console.error("[cache] read failed:", err.message);
    return null;
  }
}

export async function cacheAnswer(userId, question, result) {
  try {
    await connectRedis();

    const revision = await getUserRevision(userId);
    const questionHash = createQuestionHash(question);
    const key = `rag:${CACHE_VERSION}:user:${userId}:rev:${revision}:${questionHash}`;

    await redisClient.set(key, JSON.stringify(result), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch (err) {
    console.error("[cache] write failed:", err.message);
  }
}

export async function invalidateUserRagCache(userId) {
  try {
    await connectRedis();

    const key = `rag:${CACHE_VERSION}:revision:user:${userId}`;
    await redisClient.incr(key);
    await redisClient.expire(key, REVISION_TTL_SECONDS);

    console.log("[cache] user RAG cache revision incremented");
  } catch (err) {
    console.error("[cache] invalidation failed:", err.message);
  }
}

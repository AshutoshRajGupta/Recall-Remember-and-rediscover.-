import { retrieveRelevantChunks } from "./retrieval.service.js";
import { getCachedAnswer, cacheAnswer } from "./cache.service.js";
import { buildContext } from "./context.service.js";
import { generateAnswer } from "./llm.service.js";

const NO_CONTEXT_ANSWER =
  "I couldn't find enough information in your saved knowledge to answer this question.";

/**
 * Orchestrates the RAG flow:
 * retrieve -> build context -> generate answer -> return sources.
 */

export async function answerQuestion(rawQuestion, userId) {
  if (!userId) {
    throw new Error("Authenticated user ID is required");
  }

  // Normalize and validate before constructing the cache key.
  if (typeof rawQuestion !== "string" || !rawQuestion.trim()) {
    throw new Error("Question cannot be empty");
  }

  const normalizedQuestion = rawQuestion.trim();

  // Check Redis before generating embeddings or querying PostgreSQL.
  const cachedResult = await getCachedAnswer(userId, normalizedQuestion);

  if (cachedResult) {
    return {
      ...cachedResult,
      question: normalizedQuestion,
    };
  }

  const { question, results } = await retrieveRelevantChunks(
    normalizedQuestion,
    userId,
  );

  console.log(
    `[query] retrieval completed, ${results.length} chunk(s) passed the threshold`,
  );

  if (results.length === 0) {
    console.log("[query] no relevant context found, skipping Groq call");

    return {
      question,
      answer: NO_CONTEXT_ANSWER,
      sources: [],
    };
  }

  const context = buildContext(results);

  console.log(`[query] sending context (${results.length} chunk(s)) to Groq`);

  const answer = await generateAnswer({ question, context });

  const sources = results.map((r) => ({
    chunkId: r.chunkId,
    itemId: r.itemId,
    type: r.sourceType,
    title: r.title,
    url: r.sourceUrl,
    snippet: r.content,
    score: r.score,
  }));

  const result = { question, answer, sources };

  await cacheAnswer(userId, question, result);

  console.log("[query] Groq response received, query completed");

  return result;
}

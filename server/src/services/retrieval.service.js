import { performance } from "node:perf_hooks";
import { generateEmbedding } from "./embedding.service.js";
import { searchSimilarChunks } from "../models/chunk.model.js";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export async function retrieveRelevantChunks(rawQuestion, userId) {
  const question = typeof rawQuestion === "string" ? rawQuestion.trim() : "";

  if (!question) {
    throw new AppError(400, "Question cannot be empty");
  }

  if (!userId) {
    throw new AppError(401, "Authentication required");
  }

  const retrievalStartedAt = performance.now();

  const embeddingStartedAt = performance.now();
  console.log("[retrieval] generating query embedding");

  const questionEmbedding = await generateEmbedding(question);

  const embeddingMs = Math.round(performance.now() - embeddingStartedAt);

  const searchStartedAt = performance.now();

  const results = await searchSimilarChunks(questionEmbedding, {
    userId,
    topK: config.topK,
    similarityThreshold: config.similarityThreshold,
  });

  const vectorSearchMs = Math.round(performance.now() - searchStartedAt);

  const totalRetrievalMs = Math.round(performance.now() - retrievalStartedAt);

  console.log(
    `[perf] embedding_ms=${embeddingMs} vector_search_ms=${vectorSearchMs} ` +
      `retrieval_ms=${totalRetrievalMs} chunks=${results.length}`,
  );

  console.log(
    `[retrieval] retrieved ${results.length} chunk(s) above threshold ${config.similarityThreshold}` +
      (results.length ? `, highest score ${results[0].score.toFixed(3)}` : ""),
  );

  return {
    question,
    results,
  };
}

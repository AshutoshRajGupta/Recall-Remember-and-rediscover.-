import { generateEmbedding } from './embedding.service.js';
import { getAllChunks } from '../models/chunk.model.js';
import { getItemById } from '../models/item.model.js';
import { cosineSimilarity } from '../utils/vector.utils.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Finds the chunks most semantically similar to a question.
 *
 * Prototype-scale approach: load every chunk, score it against the question
 * embedding, sort, keep the top matches above a minimum similarity. No index -
 * see README "Retrieval" for why that's fine here and what it means at scale.
 */
export async function retrieveRelevantChunks(rawQuestion) {
  const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';
  if (!question) {
    throw new AppError(400, 'Question cannot be empty');
  }

  console.log('[retrieval] generating query embedding');
  // Same embedding.service.js / same model used for chunks - required so the
  // question and the chunks land in the same vector space and are comparable.
  const questionEmbedding = await generateEmbedding(question);

  const chunks = getAllChunks();
  console.log(`[retrieval] searching ${chunks.length} chunk(s)`);

  const scored = chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(questionEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score);

  const topMatches = scored
    .filter((entry) => entry.score >= config.similarityThreshold)
    .slice(0, config.topK);

  console.log(
    `[retrieval] retrieved ${topMatches.length} chunk(s) above threshold ${config.similarityThreshold}` +
      (topMatches.length ? `, highest score ${topMatches[0].score.toFixed(3)}` : '')
  );

  const results = topMatches.map(({ chunk, score }) => {
    const item = getItemById(chunk.itemId);
    return {
      chunkId: chunk.id,
      itemId: chunk.itemId,
      content: chunk.content,
      score: Number(score.toFixed(4)),
      sourceType: item?.type ?? null,
      sourceUrl: item?.sourceUrl ?? null,
      title: item?.title ?? null,
    };
  });

  return { question, results };
}

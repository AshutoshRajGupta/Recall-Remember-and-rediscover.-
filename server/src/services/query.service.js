import { retrieveRelevantChunks } from './retrieval.service.js';
import { buildContext } from './context.service.js';
import { generateAnswer } from './llm.service.js';

const NO_CONTEXT_ANSWER =
  "I couldn't find enough information in your saved knowledge to answer this question.";

/**
 * Orchestrates the full RAG flow: retrieve -> (skip LLM if nothing relevant) ->
 * build context -> ask Groq -> shape the answer + sources for the API response.
 *
 * Source metadata (chunkId/itemId/type/url/snippet/score) is built here, by us,
 * from the retrieved DB records - never by the LLM. The LLM only ever sees the
 * chunk *text* via buildContext(); it never sees ids, urls or scores, so it has
 * nothing to invent citations from.
 */
export async function answerQuestion(rawQuestion) {
  const { question, results } = await retrieveRelevantChunks(rawQuestion);
  console.log(`[query] retrieval completed, ${results.length} chunk(s) passed the threshold`);

  if (results.length === 0) {
    console.log('[query] no relevant context found, skipping Groq call');
    return { question, answer: NO_CONTEXT_ANSWER, sources: [] };
  }

  const context = buildContext(results);

  console.log(`[query] sending context (${results.length} chunk(s)) to Groq`);
  const answer = await generateAnswer({ question, context });
  console.log('[query] Groq response received, query completed');

  const sources = results.map((r) => ({
    chunkId: r.chunkId,
    itemId: r.itemId,
    type: r.sourceType,
    title: r.title,
    url: r.sourceUrl,
    snippet: r.content,
    score: r.score,
  }));

  return { question, answer, sources };
}

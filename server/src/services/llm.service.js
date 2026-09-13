import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Groq exposes an OpenAI-compatible chat completions endpoint - no separate SDK needed.
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 20000;

const SYSTEM_PROMPT = `You are an AI assistant answering questions using only a user's saved knowledge (their notes and saved web pages).

Rules:
- Answer using ONLY the provided context below. Do not use outside/general knowledge.
- Do not invent, assume, or hallucinate facts that are not present in the context.
- If the context does not contain enough information to answer, say so plainly instead of guessing.
- Be concise and directly answer the question when the context supports it.
- The sources are shown separately to the user, so you do not need to cite them inline.`;

/**
 * Sends a question + pre-built context to Groq and returns the generated answer text.
 * Never called when retrieval found nothing relevant - see query.service.js.
 */
export async function generateAnswer({ question, context }) {
  if (!config.groqApiKey) {
    throw new AppError(500, 'AI service is not configured');
  }

  const userPrompt = `Context:\n${context}\n\nQuestion:\n${question}`;

  let response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(GROQ_API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.groqChatModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error('[llm] request to Groq failed:', err.message);
    throw new AppError(503, 'AI service is temporarily unavailable.');
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    console.error(`[llm] Groq API responded with ${response.status}: ${bodyText.slice(0, 300)}`);
    throw new AppError(502, 'AI service is temporarily unavailable.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    console.error('[llm] Groq response was not valid JSON');
    throw new AppError(502, 'AI service returned an invalid response.');
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    console.error('[llm] Groq response had no answer content');
    throw new AppError(502, 'AI service returned an invalid response.');
  }

  console.log(`[llm] answer generated (model=${config.groqChatModel})`);
  return answer;
}

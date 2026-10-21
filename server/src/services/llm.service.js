import { performance } from "node:perf_hooks";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Groq exposes an OpenAI-compatible chat completions endpoint.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 20000;

const GENERAL_CHAT_SYSTEM_PROMPT = `You are a helpful general-purpose AI assistant.

Response style:
- Start by directly answering the user's question.
- Do not use generic headings like "X in a nutshell", "Overview", or "Introduction" unless explicitly requested.
- Use a heading only when it improves readability.
- For simple questions, answer in 1-3 short paragraphs.
- For complex questions, use meaningful headings and concise bullet points.
- Use Markdown formatting for readability.
- Use fenced code blocks with the correct language for code examples.
- Avoid unnecessary repetition, oversized tables, and lengthy introductions.
- Adapt the answer's length to the question.
- If you are uncertain, say so honestly.
- Never claim to have accessed the user's saved notes or files.`;

const SYSTEM_PROMPT = `You are an AI assistant answering questions using only a user's saved knowledge (their notes and saved web pages).

Rules:
- Answer using ONLY the provided context below. Do not use outside/general knowledge.
- Do not invent, assume, or hallucinate facts that are not present in the context.
- If the context does not contain enough information to answer, say so plainly instead of guessing.
- Be concise and directly answer the question when the context supports it.
- The sources are shown separately to the user, so you do not need to cite them inline.`;

/**
 * Sends a general-purpose chat message to Groq.
 */
export async function generateChatAnswer({ message }) {
  if (!config.groqApiKey) {
    throw new AppError(500, "AI service is not configured");
  }

  const llmStartedAt = performance.now();

  let response;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.groqChatModel,
          messages: [
            {
              role: "system",
              content: GENERAL_CHAT_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.5,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("[llm] general chat request failed:", err.message);
    throw new AppError(503, "AI service is temporarily unavailable.");
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      `[llm] Groq API responded with ${response.status}: ${bodyText.slice(0, 300)}`,
    );
    throw new AppError(502, "AI service is temporarily unavailable.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new AppError(502, "AI service returned an invalid response.");
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new AppError(502, "AI service returned an invalid response.");
  }

  console.log(
    `[perf] general_chat_groq_ms=${Math.round(
      performance.now() - llmStartedAt,
    )}`,
  );

  console.log(
    `[llm] general chat answer generated (model=${config.groqChatModel})`,
  );

  return answer;
}

/**
 * Sends a question and prepared knowledge context to Groq for RAG.
 */
export async function generateAnswer({ question, context }) {
  if (!config.groqApiKey) {
    throw new AppError(500, "AI service is not configured");
  }

  const userPrompt = `Context:\n${context}\n\nQuestion:\n${question}`;
  const llmStartedAt = performance.now();

  let response;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.groqChatModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("[llm] request to Groq failed:", err.message);
    throw new AppError(503, "AI service is temporarily unavailable.");
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      `[llm] Groq API responded with ${response.status}: ${bodyText.slice(0, 300)}`,
    );
    throw new AppError(502, "AI service is temporarily unavailable.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    console.error("[llm] Groq response was not valid JSON");
    throw new AppError(502, "AI service returned an invalid response.");
  }

  const answer = data?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    console.error("[llm] Groq response had no answer content");
    throw new AppError(502, "AI service returned an invalid response.");
  }

  console.log(
    `[perf] rag_groq_ms=${Math.round(performance.now() - llmStartedAt)}`,
  );

  console.log(`[llm] answer generated (model=${config.groqChatModel})`);

  return answer;
}

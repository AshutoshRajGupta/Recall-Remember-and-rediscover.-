// Defensive cap on top of chunking's own ~650-word target - guards against an
// unusually large chunk (e.g. from a future change to chunking) blowing up the
// prompt sent to Groq. Documented as a prototype limitation in the README.
const MAX_CHUNK_CHARS_IN_CONTEXT = 2000;

function truncate(text) {
  if (text.length <= MAX_CHUNK_CHARS_IN_CONTEXT) return text;
  return `${text.slice(0, MAX_CHUNK_CHARS_IN_CONTEXT)}...`;
}

/**
 * Turns retrieved chunks into the "Context:" block sent to the LLM.
 * Only ever given the chunks that survived retrieval's Top-K + threshold -
 * never the whole database.
 */
export function buildContext(retrievedChunks) {
  return retrievedChunks
    .map((chunk, index) => `[Source ${index + 1}]\n${truncate(chunk.content)}`)
    .join('\n\n');
}

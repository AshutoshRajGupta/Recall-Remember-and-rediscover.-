// Word-count based chunking (not model tokens - see README "Chunking Strategy"
// for why that distinction is fine for this prototype).
const CHUNK_SIZE_WORDS = 650; // within the requested 500-800 word range
const CHUNK_OVERLAP_WORDS = 75; // within the requested 50-100 word range
const MIN_TRAILING_CHUNK_WORDS = 50; // avoid a tiny leftover final chunk

/**
 * Splits text into ordered, moderately sized, overlapping chunks.
 * Short content (<= CHUNK_SIZE_WORDS) is returned as a single chunk.
 */
export function chunkText(text) {
  const words = typeof text === 'string' ? text.trim().split(/\s+/).filter(Boolean) : [];

  if (words.length === 0) {
    return [];
  }

  if (words.length <= CHUNK_SIZE_WORDS) {
    return [words.join(' ')];
  }

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    chunks.push(words.slice(start, end).join(' '));

    if (end === words.length) {
      break;
    }

    start = end - CHUNK_OVERLAP_WORDS;
  }

  // Fold a too-small trailing chunk into the previous one instead of storing a fragment.
  if (chunks.length > 1) {
    const lastWordCount = chunks[chunks.length - 1].split(/\s+/).length;
    if (lastWordCount < MIN_TRAILING_CHUNK_WORDS) {
      const last = chunks.pop();
      chunks[chunks.length - 1] += ` ${last}`;
    }
  }

  return chunks;
}

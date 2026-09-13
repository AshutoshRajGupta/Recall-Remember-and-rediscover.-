/**
 * Cosine similarity between two equal-length vectors:
 *   (A · B) / (|A| * |B|)
 * Result is generally in [-1, 1]; for normalized sentence embeddings, higher
 * means more semantically similar. Returns 0 for a zero-length vector instead
 * of dividing by zero.
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

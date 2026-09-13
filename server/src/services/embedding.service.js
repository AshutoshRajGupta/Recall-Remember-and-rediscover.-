import { pipeline } from '@huggingface/transformers';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Lazily-created, memoized so the model is downloaded/loaded into memory once
// per process and every call to generateEmbedding() reuses the same instance.
let embedderPromise = null;

function loadEmbedder() {
  if (!embedderPromise) {
    console.log(`Loading embedding model (${config.embeddingModel})...`);
    embedderPromise = pipeline('feature-extraction', config.embeddingModel)
      .then((embedder) => {
        console.log('Embedding model ready');
        return embedder;
      })
      .catch((err) => {
        // Allow a later call to retry instead of permanently caching the failure.
        embedderPromise = null;
        console.error('Failed to load embedding model:', err.message);
        throw err;
      });
  }

  return embedderPromise;
}

/** Kicks off model loading without blocking the caller. Safe to call at server startup. */
export function preloadEmbeddingModel() {
  return loadEmbedder().catch(() => {
    // Already logged in loadEmbedder(). A real request will trigger (and surface) a retry.
  });
}

/** Generates a normalized embedding vector (array of floats) for a piece of text. */
export async function generateEmbedding(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw new AppError(400, 'Cannot generate an embedding for empty content');
  }

  let embedder;
  try {
    embedder = await loadEmbedder();
  } catch {
    throw new AppError(500, 'Embedding model is unavailable');
  }

  try {
    const output = await embedder(trimmed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding generation failed:', err.message);
    throw new AppError(500, 'Failed to generate embedding');
  }
}

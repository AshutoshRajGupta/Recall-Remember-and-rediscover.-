import { chunkText } from './chunking.service.js';
import { generateEmbedding } from './embedding.service.js';
import { createChunks } from '../models/chunk.model.js';

/**
 * Chunks an item's content, embeds each chunk, and persists the results.
 *
 * Design choice: indexing never throws. If the model fails to load, or one
 * chunk fails to embed, that failure is logged and the item is simply left
 * with fewer (or zero) chunks - it stays fully readable/listable and can be
 * picked up later by the backfill script. We don't want a transient embedding
 * hiccup to turn into a failed /ingest request after the item has already
 * been saved to SQLite.
 */
export async function indexItem(item) {
  const chunks = chunkText(item.content);

  if (chunks.length === 0) {
    console.warn(`[index] item ${item.id}: no chunks produced (empty content), skipping`);
    return { itemId: item.id, chunkCount: 0 };
  }

  const chunkRecords = [];

  for (let i = 0; i < chunks.length; i += 1) {
    try {
      const embedding = await generateEmbedding(chunks[i]);
      chunkRecords.push({ itemId: item.id, chunkIndex: i, content: chunks[i], embedding });
    } catch (err) {
      console.error(`[index] item ${item.id}: failed to embed chunk ${i}/${chunks.length}: ${err.message}`);
    }
  }

  if (chunkRecords.length === 0) {
    console.error(`[index] item ${item.id}: indexing failed, 0/${chunks.length} chunk(s) embedded`);
    return { itemId: item.id, chunkCount: 0 };
  }

  createChunks(chunkRecords);
  console.log(`[index] item ${item.id}: stored ${chunkRecords.length}/${chunks.length} chunk(s)`);

  return { itemId: item.id, chunkCount: chunkRecords.length };
}

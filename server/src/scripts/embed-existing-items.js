// One-off backfill: indexes any item that predates chunking/embeddings, or that
// failed to index for some other reason. Safe to re-run - items that already
// have chunks are skipped, so it never creates duplicate chunks.
//
// Usage: npm run backfill   (from server/)
import { getAllItems } from '../models/item.model.js';
import { getChunksByItemId } from '../models/chunk.model.js';
import { indexItem } from '../services/indexing.service.js';

async function run() {
  const items = getAllItems();
  console.log(`[backfill] found ${items.length} item(s) in the database`);

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const existingChunks = getChunksByItemId(item.id);

    if (existingChunks.length > 0) {
      skipped += 1;
      console.log(`[backfill] item ${item.id} (${item.type}): already has ${existingChunks.length} chunk(s), skipping`);
      continue;
    }

    console.log(`[backfill] item ${item.id} (${item.type}): indexing...`);
    const result = await indexItem(item);

    if (result.chunkCount > 0) {
      indexed += 1;
    } else {
      failed += 1;
      console.error(`[backfill] item ${item.id}: indexing produced no chunks`);
    }
  }

  console.log(
    `[backfill] done - indexed: ${indexed}, already indexed: ${skipped}, failed: ${failed}, total: ${items.length}`
  );
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] unexpected error:', err);
    process.exit(1);
  });

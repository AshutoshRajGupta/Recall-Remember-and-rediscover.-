import { getAllItemsForBackfill } from "../models/item.model.js";
import { getChunksByItemIdForMaintenance } from "../models/chunk.model.js";
import { indexItem } from "../services/indexing.service.js";
import { pool } from "../models/db.js";

async function run() {
  const items = await getAllItemsForBackfill();

  console.log(`[backfill] found ${items.length} item(s) across all users`);

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const existingChunks = await getChunksByItemIdForMaintenance(item.id);

      if (existingChunks.length > 0) {
        skipped += 1;

        console.log(
          `[backfill] item ${item.id} (${item.type}): already has ${existingChunks.length} chunk(s), skipping`,
        );

        continue;
      }

      console.log(`[backfill] item ${item.id} (${item.type}): indexing...`);

      const result = await indexItem(item);

      if (result.chunkCount > 0) {
        indexed += 1;
      } else {
        failed += 1;

        console.error(
          `[backfill] item ${item.id}: indexing produced no chunks`,
        );
      }
    } catch (error) {
      failed += 1;

      console.error(
        `[backfill] item ${item.id}: backfill failed: ${error.message}`,
      );
    }
  }

  console.log(
    `[backfill] done - indexed: ${indexed}, already indexed: ${skipped}, failed: ${failed}, total: ${items.length}`,
  );
}

run()
  .catch((error) => {
    console.error("[backfill] unexpected error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

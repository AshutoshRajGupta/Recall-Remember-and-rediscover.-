import { pool } from "./db.js";

function toChunkDTO(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    embedding:
      typeof row.embedding === "string"
        ? JSON.parse(row.embedding)
        : row.embedding,
    createdAt: row.created_at,
  };
}

export async function createChunk({ itemId, chunkIndex, content, embedding }) {
  const result = await pool.query(
    `
      INSERT INTO chunks (
        item_id,
        chunk_index,
        content,
        embedding
      )
      VALUES ($1, $2, $3, $4::vector)
      RETURNING id
    `,
    [itemId, chunkIndex, content, JSON.stringify(embedding)],
  );

  return result.rows[0].id;
}

/**
 * Inserts all chunks for one item in a single transaction.
 * Either every chunk is inserted or none is.
 */
export async function createChunks(chunkRecords) {
  if (chunkRecords.length === 0) return [];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ids = [];

    for (const record of chunkRecords) {
      const { itemId, chunkIndex, content, embedding } = record;

      const result = await client.query(
        `
          INSERT INTO chunks (
            item_id,
            chunk_index,
            content,
            embedding
          )
          VALUES ($1, $2, $3, $4::vector)
          RETURNING id
        `,
        [itemId, chunkIndex, content, JSON.stringify(embedding)],
      );

      ids.push(result.rows[0].id);
    }

    await client.query("COMMIT");

    return ids;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to roll back chunk transaction:", rollbackError);
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * Internal maintenance helper.
 * Only use in trusted maintenance scripts, never directly in API routes.
 */
export async function getChunksByItemIdForMaintenance(itemId) {
  const result = await pool.query(
    `
      SELECT
        id,
        item_id,
        chunk_index,
        content,
        embedding,
        created_at
      FROM chunks
      WHERE item_id = $1
      ORDER BY chunk_index ASC
    `,
    [itemId],
  );

  return result.rows.map(toChunkDTO);
}

/**
 * Internal maintenance helper.
 * Only use in trusted maintenance scripts, never directly in API routes.
 */
export async function deleteChunksByItemIdForMaintenance(itemId) {
  await pool.query("DELETE FROM chunks WHERE item_id = $1", [itemId]);
}

/**
 * Finds relevant chunks belonging only to the specified user.
 */
export async function searchSimilarChunks(
  embedding,
  { userId, topK = 5, similarityThreshold = 0.3 } = {},
) {
  if (!userId) {
    throw new Error("Authenticated user ID is required for semantic search");
  }

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.item_id,
        c.chunk_index,
        c.content,
        1 - (c.embedding <=> $1::vector) AS similarity,
        i.source_type,
        i.source_url,
        i.title
      FROM chunks c
      JOIN items i ON i.id = c.item_id
      WHERE i.user_id = $2
        AND 1 - (c.embedding <=> $1::vector) >= $3
      ORDER BY c.embedding <=> $1::vector ASC
      LIMIT $4
    `,
    [JSON.stringify(embedding), userId, similarityThreshold, topK],
  );

  return result.rows.map((row) => ({
    chunkId: row.id,
    itemId: row.item_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    score: Number(Number(row.similarity).toFixed(4)),
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    title: row.title,
  }));
}

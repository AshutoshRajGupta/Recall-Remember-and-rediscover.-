import { db } from './db.js';

const insertChunkStmt = db.prepare(`
  INSERT INTO chunks (item_id, chunk_index, content, embedding)
  VALUES (?, ?, ?, ?)
`);

const selectByItemIdStmt = db.prepare(`
  SELECT id, item_id, chunk_index, content, embedding, created_at
  FROM chunks
  WHERE item_id = ?
  ORDER BY chunk_index ASC
`);

const selectAllStmt = db.prepare(`
  SELECT id, item_id, chunk_index, content, embedding, created_at
  FROM chunks
`);

const deleteByItemIdStmt = db.prepare(`
  DELETE FROM chunks WHERE item_id = ?
`);

function toChunkDTO(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    embedding: JSON.parse(row.embedding),
    createdAt: row.created_at,
  };
}

export function createChunk({ itemId, chunkIndex, content, embedding }) {
  const result = insertChunkStmt.run(itemId, chunkIndex, content, JSON.stringify(embedding));
  return Number(result.lastInsertRowid);
}

/** Inserts all chunks for one item in a single transaction (all-or-nothing). */
export function createChunks(chunkRecords) {
  if (chunkRecords.length === 0) return [];

  db.exec('BEGIN');
  try {
    const ids = chunkRecords.map((record) => createChunk(record));
    db.exec('COMMIT');
    return ids;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getChunksByItemId(itemId) {
  return selectByItemIdStmt.all(itemId).map(toChunkDTO);
}

/** All chunks across all items, with embeddings parsed - used for retrieval (Step 4). */
export function getAllChunks() {
  return selectAllStmt.all().map(toChunkDTO);
}

export function deleteChunksByItemId(itemId) {
  deleteByItemIdStmt.run(itemId);
}

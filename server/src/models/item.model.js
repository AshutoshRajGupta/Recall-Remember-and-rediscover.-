import { db } from './db.js';

const insertStmt = db.prepare(`
  INSERT INTO items (content, source_type, source_url, title)
  VALUES (?, ?, ?, ?)
`);

const selectByIdStmt = db.prepare(`
  SELECT id, content, source_type, source_url, title, created_at
  FROM items
  WHERE id = ?
`);

const selectAllStmt = db.prepare(`
  SELECT id, content, source_type, source_url, title, created_at
  FROM items
  ORDER BY id DESC
`);

function toItemDTO(row) {
  return {
    id: row.id,
    type: row.source_type,
    content: row.content,
    sourceUrl: row.source_url ?? null,
    title: row.title ?? null,
    createdAt: row.created_at,
  };
}

export function createItem({ content, sourceType, sourceUrl = null, title = null }) {
  const result = insertStmt.run(content, sourceType, sourceUrl, title);
  const row = selectByIdStmt.get(Number(result.lastInsertRowid));
  return toItemDTO(row);
}

export function getAllItems() {
  return selectAllStmt.all().map(toItemDTO);
}

/** Used by retrieval (Step 4) to attach source info to a matched chunk. Null if not found. */
export function getItemById(id) {
  const row = selectByIdStmt.get(id);
  return row ? toItemDTO(row) : null;
}

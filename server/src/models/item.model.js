import { pool } from "./db.js";

function toItemDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    type: row.source_type,
    content: row.content,
    sourceUrl: row.source_url ?? null,
    title: row.title ?? null,
    createdAt: row.created_at,
  };
}

export async function createItem({
  userId,
  content,
  sourceType,
  sourceUrl = null,
  title = null,
}) {
  if (!userId) {
    throw new Error("Authenticated user ID is required");
  }

  const result = await pool.query(
    `
      INSERT INTO items (
        user_id,
        content,
        source_type,
        source_url,
        title
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, content, source_type, source_url, title, created_at
    `,
    [userId, content, sourceType, sourceUrl, title],
  );

  return toItemDTO(result.rows[0]);
}

export async function getAllItems(userId) {
  if (!userId) {
    throw new Error("Authenticated user ID is required");
  }

  const result = await pool.query(
    `
      SELECT id, content, source_type, source_url, title, created_at
      FROM items
      WHERE user_id = $1
      ORDER BY id DESC
    `,
    [userId],
  );

  return result.rows.map(toItemDTO);
}

export async function getItemById(id, userId) {
  if (!userId) {
    throw new Error("Authenticated user ID is required");
  }

  const result = await pool.query(
    `
      SELECT id, content, source_type, source_url, title, created_at
      FROM items
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [id, userId],
  );

  return toItemDTO(result.rows[0]);
}

/**
 * Internal maintenance helper.
 * Retrieves items across all users for backfill operations.
 * Never use this function in user-facing API controllers.
 */
export async function getAllItemsForBackfill() {
  const result = await pool.query(
    `
      SELECT id, content, source_type, source_url, title, created_at
      FROM items
      ORDER BY id DESC
    `,
  );

  return result.rows.map(toItemDTO);
}

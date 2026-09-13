import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';

const dbDir = path.dirname(config.dbPath);
if (dbDir && dbDir !== '.' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Required for the chunks.item_id foreign key (and its ON DELETE CASCADE) to be enforced -
// SQLite ignores foreign key constraints on a connection unless this is turned on.
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('note', 'url')),
    source_url TEXT,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// One row per chunk of an item's content, holding that chunk's embedding vector
// (serialized as JSON text - see README for why we skip a dedicated vector DB for now).
db.exec(`
  CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec('CREATE INDEX IF NOT EXISTS idx_chunks_item_id ON chunks(item_id)');

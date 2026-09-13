import { createItem } from '../models/item.model.js';
import { fetchUrlContent } from './url-fetcher.service.js';
import { indexItem } from './indexing.service.js';
import { AppError } from '../utils/AppError.js';

async function ingestNote(content) {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) {
    throw new AppError(400, 'Note content cannot be empty');
  }

  const item = createItem({ content: trimmed, sourceType: 'note' });
  await indexItem(item);
  return item;
}

async function ingestUrl(rawUrl) {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!trimmed) {
    throw new AppError(400, 'URL is required');
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new AppError(400, 'Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError(400, 'Invalid URL');
  }

  const { title, content } = await fetchUrlContent(parsed.toString());

  const item = createItem({
    content,
    sourceType: 'url',
    sourceUrl: parsed.toString(),
    title,
  });
  await indexItem(item);
  return item;
}

export async function ingestItem({ type, content, url }) {
  if (!type) {
    throw new AppError(400, 'Missing "type" field (expected "note" or "url")');
  }

  if (type === 'note') {
    return ingestNote(content);
  }

  if (type === 'url') {
    return ingestUrl(url);
  }

  throw new AppError(400, `Unsupported type "${type}" (expected "note" or "url")`);
}

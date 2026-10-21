import { createItem } from "../models/item.model.js";
import { fetchUrlContent } from "./url-fetcher.service.js";
import { indexItem } from "./indexing.service.js";
import { invalidateUserRagCache } from "./cache.service.js";
import { AppError } from "../utils/AppError.js";

async function ingestNote(content, userId) {
  const trimmed = typeof content === "string" ? content.trim() : "";

  if (!trimmed) {
    throw new AppError(400, "Note content cannot be empty");
  }

  const item = await createItem({
    userId,
    content: trimmed,
    sourceType: "note",
  });

  await indexItem(item);

  // Invalidate cached RAG answers after the new note is indexed.
  await invalidateUserRagCache(userId);

  return item;
}

async function ingestUrl(rawUrl, userId) {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!trimmed) {
    throw new AppError(400, "URL is required");
  }

  let parsed;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new AppError(400, "Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError(400, "Invalid URL");
  }

  const { title, content } = await fetchUrlContent(parsed.toString());

  const item = await createItem({
    userId,
    content,
    sourceType: "url",
    sourceUrl: parsed.toString(),
    title,
  });

  await indexItem(item);

  // Invalidate cached RAG answers after the new URL is indexed.
  await invalidateUserRagCache(userId);

  return item;
}

export async function ingestItem({ type, content, url, userId }) {
  if (!userId) {
    throw new AppError(401, "Authentication required");
  }

  if (!type) {
    throw new AppError(400, 'Missing "type" field (expected "note" or "url")');
  }

  if (type === "note") {
    return ingestNote(content, userId);
  }

  if (type === "url") {
    return ingestUrl(url, userId);
  }

  throw new AppError(
    400,
    `Unsupported type "${type}" (expected "note" or "url")`,
  );
}

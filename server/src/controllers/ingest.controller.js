import { ingestItem } from '../services/ingestion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const postIngest = asyncHandler(async (req, res) => {
  const { type, content, url } = req.body ?? {};
  const item = await ingestItem({ type, content, url });
  res.status(201).json({ item });
});

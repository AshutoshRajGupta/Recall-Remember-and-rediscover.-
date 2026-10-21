import { getAllItems } from "../models/item.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getItems = asyncHandler(async (req, res) => {
  const items = await getAllItems(req.user.id);

  res.status(200).json({ items });
});

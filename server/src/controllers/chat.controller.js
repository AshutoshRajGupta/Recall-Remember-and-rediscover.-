import { sendChatMessage } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postChatMessage = asyncHandler(async (req, res) => {
  const { message } = req.body ?? {};

  const result = await sendChatMessage(message);

  res.status(200).json(result);
});

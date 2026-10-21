import { generateChatAnswer } from "./llm.service.js";
import { AppError } from "../utils/AppError.js";

const MAX_MESSAGE_LENGTH = 4000;

export async function sendChatMessage(rawMessage) {
  if (typeof rawMessage !== "string" || !rawMessage.trim()) {
    throw new AppError(400, "Please enter a message.");
  }

  const message = rawMessage.trim();

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      400,
      `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  const answer = await generateChatAnswer({ message });

  return {
    message,
    answer,
  };
}

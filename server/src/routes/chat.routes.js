import { Router } from "express";
import { postChatMessage } from "../controllers/chat.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, postChatMessage);

export default router;

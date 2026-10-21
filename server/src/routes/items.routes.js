import { Router } from "express";
import { getItems } from "../controllers/items.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateToken, getItems);

export default router;

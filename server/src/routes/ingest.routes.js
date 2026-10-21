import { Router } from "express";
import { postIngest } from "../controllers/ingest.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, postIngest);

export default router;

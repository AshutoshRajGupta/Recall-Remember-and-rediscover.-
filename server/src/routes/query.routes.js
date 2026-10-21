import { Router } from "express";
import { postQuery } from "../controllers/query.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, postQuery);

export default router;

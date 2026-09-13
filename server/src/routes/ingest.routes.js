import { Router } from 'express';
import { postIngest } from '../controllers/ingest.controller.js';

const router = Router();

router.post('/', postIngest);

export default router;

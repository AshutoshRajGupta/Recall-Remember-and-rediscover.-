import { Router } from 'express';
import { postQuery } from '../controllers/query.controller.js';

const router = Router();

router.post('/', postQuery);

export default router;

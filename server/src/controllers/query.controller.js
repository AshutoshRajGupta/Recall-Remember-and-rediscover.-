import { answerQuestion } from '../services/query.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const postQuery = asyncHandler(async (req, res) => {
  const { question } = req.body ?? {};
  const result = await answerQuestion(question);
  res.status(200).json(result);
});

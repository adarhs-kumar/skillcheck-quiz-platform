import { Router } from 'express';
import { generateQuizHandler, saveQuizAttemptHandler, getLeaderboardHandler, getHistoryHandler } from '../controllers/quiz.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/generate', generateQuizHandler);
router.post('/save', requireAuth, saveQuizAttemptHandler);
router.get('/leaderboard', getLeaderboardHandler);
router.get('/history', requireAuth, getHistoryHandler);

export default router;

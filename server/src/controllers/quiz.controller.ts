import { Request, Response } from 'express';
import { quizQueue } from '../queues/quiz.queue';

export const generateQuizHandler = async (req: Request, res: Response) => {
  try {
    const { topic, socketId, difficulty = 'Intermediate', questionCount = 5 } = req.body;

    if (!topic || !socketId) {
      return res.status(400).json({ 
        error: 'Missing required fields: topic and socketId are required.' 
      });
    }

    // Add task to BullMQ
    const job = await quizQueue.add('generate', {
      topic,
      socketId,
      difficulty,
      questionCount
    });

    console.log(`[API] Enqueued job ${job.id} for topic "${topic}"`);

    // Return immediately so we don't block
    return res.status(202).json({
      message: 'Quiz generation started.',
      jobId: job.id
    });
  } catch (error) {
    console.error('[API] Error enqueueing quiz generation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

import { QuizAttempt } from '../models/QuizAttempt';
import { AuthRequest } from '../middleware/auth.middleware';

export const saveQuizAttemptHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { topic, difficulty, score, totalQuestions, timeTaken, guestUserId } = req.body;
    
    if (!topic || !difficulty || score === undefined || !totalQuestions || timeTaken === undefined) {
      return res.status(400).json({ error: 'Missing required fields for saving attempt.' });
    }

    const attempt = await QuizAttempt.create({
      topic,
      difficulty,
      score,
      totalQuestions,
      timeTaken,
      user: req.user?.id || null,
      guestUserId: req.user?.id ? undefined : guestUserId
    });

    return res.status(201).json({ success: true, attempt });
  } catch (error) {
    console.error('[API] Error saving quiz attempt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaderboardHandler = async (req: Request, res: Response) => {
  try {
    const leaderboard = await QuizAttempt.find()
      .sort({ score: -1, timeTaken: 1 })
      .limit(10)
      .populate('user', 'name avatar');
    
    return res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('[API] Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHistoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const guestUserId = req.query.guestUserId as string;
    let query: any = {};
    
    if (req.user?.id) {
      query.user = req.user.id;
    } else if (guestUserId) {
      query.guestUserId = guestUserId;
    } else {
      return res.status(400).json({ error: 'Must provide auth token or guestUserId' });
    }

    const history = await QuizAttempt.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    return res.json({ success: true, history });
  } catch (error) {
    console.error('[API] Error fetching history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import AttemptService from '../services/attemptService.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * POST /api/attempts
 * Start a new quiz attempt
 */
router.post('/', async (req, res) => {
  try {
    const { quizId, classId } = req.body;

    if (!quizId || !classId) {
      return res.status(400).json({ success: false, message: 'quizId and classId are required' });
    }

    const attempt = await AttemptService.startAttempt(quizId, req.user.id, classId);
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/attempts/:attemptId
 * Get attempt details
 */
router.get('/:attemptId', async (req, res) => {
  try {
    const attempt = await AttemptService.getAttempt(req.params.attemptId);
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/attempts/:attemptId/answer
 * Submit answer to a question
 */
router.post('/:attemptId/answer', async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      return res.status(400).json({ success: false, message: 'questionId and answer are required' });
    }

    const result = await AttemptService.submitAnswer(req.params.attemptId, questionId, answer);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/attempts/:attemptId/complete
 * Complete a quiz attempt (calculates final score)
 */
router.post('/:attemptId/complete', async (req, res) => {
  try {
    const completed = await AttemptService.completeAttempt(req.params.attemptId);
    res.json({ success: true, data: completed });
  } catch (error) {
    console.error('Complete attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/attempts/quiz/:quizId
 * Get all attempts for a quiz
 */
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const attempts = await AttemptService.getQuizAttempts(req.params.quizId);
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/attempts/class/:classId/student
 * Get all attempts by student in a class
 */
router.get('/class/:classId/student', async (req, res) => {
  try {
    const attempts = await AttemptService.getStudentClassAttempts(req.params.classId, req.user.id);
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get student attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/attempts/:attemptId
 * Delete an attempt (typically only before completion)
 */
router.delete('/:attemptId', async (req, res) => {
  try {
    await AttemptService.deleteAttempt(req.params.attemptId);
    res.json({ success: true, message: 'Attempt deleted' });
  } catch (error) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

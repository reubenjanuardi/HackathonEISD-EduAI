import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import AnalyticsService from '../services/analyticsService.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * GET /api/analytics/class/:classId
 * Get overall analytics for a class
 * Teacher only: returns class-wide metrics
 * Student: returns personal performance in class
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getClassAnalytics(req.params.classId, req.user.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get class analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/quiz/:quizId
 * Get analytics for a specific quiz
 * Shows attempt count, average score, question difficulty analysis
 */
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getQuizAnalytics(req.params.quizId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get quiz analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/quiz/:quizId/difficulty
 * Get question difficulty analysis
 * Shows which questions are difficult, common mistakes
 */
router.get('/quiz/:quizId/difficulty', async (req, res) => {
  try {
    const analysis = await AnalyticsService.getQuestionDifficultyAnalysis(req.params.quizId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Get difficulty analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/analytics/class/:classId/at-risk
 * Get students at risk (low performance)
 * Teacher only endpoint
 */
router.get('/class/:classId/at-risk', async (req, res) => {
  try {
    const students = await AnalyticsService.getAtRiskStudents(req.params.classId);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get at-risk students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/analytics/student/:studentId/progress
 * Update or recalculate student progress
 * Used after completing an attempt
 */
router.post('/student/:studentId/progress', async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId is required' });
    }

    const progress = await AnalyticsService.updateStudentProgress(req.params.studentId, classId);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

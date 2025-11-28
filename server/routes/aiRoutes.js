import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import AIService from '../services/aiService.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * POST /api/ai/generate-quiz
 * Generate quiz questions from material content using AIML API
 * Body: { materialId, classId, numQuestions, difficulty }
 */
router.post('/generate-quiz', async (req, res) => {
  try {
    const { materialId, classId, numQuestions = 10, difficulty = 'medium' } = req.body;

    if (!materialId || !classId) {
      return res.status(400).json({ success: false, message: 'materialId and classId are required' });
    }

    const quiz = await AIService.generateQuizFromMaterial(materialId, classId, req.user.id, {
      numQuestions,
      difficulty,
    });

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/summarize-material
 * Generate AI summary for uploaded material
 * Body: { materialId }
 */
router.post('/summarize-material', async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ success: false, message: 'materialId is required' });
    }

    const summary = await AIService.summarizeMaterial(materialId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Summarize material error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ai/insights/:classId
 * Get AI-generated insights for class
 * Shows struggling areas, recommended focus topics
 */
router.get('/insights/:classId', async (req, res) => {
  try {
    const insights = await AIService.getClassInsights(req.params.classId);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ai/student-recommendations/:classId
 * Get personalized learning recommendations for student
 */
router.get('/student-recommendations/:classId', async (req, res) => {
  try {
    const recommendations = await AIService.getStudentRecommendations(req.params.classId, req.user.id);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/generate-adaptive-quiz
 * Generate adaptive quiz based on student performance
 * Adjusts difficulty based on previous attempts
 * Body: { classId, topicId }
 */
router.post('/generate-adaptive-quiz', async (req, res) => {
  try {
    const { classId, topicId } = req.body;

    if (!classId || !topicId) {
      return res.status(400).json({ success: false, message: 'classId and topicId are required' });
    }

    const quiz = await AIService.generateAdaptiveQuiz(classId, req.user.id, topicId);
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Generate adaptive quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

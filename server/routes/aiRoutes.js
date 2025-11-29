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

    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId is required' });
    }

    if (!materialId) {
      return res.status(400).json({ success: false, message: 'materialId is required' });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    const normalizedDifficulty = validDifficulties.includes(difficulty.toLowerCase()) 
      ? difficulty.toLowerCase() 
      : 'medium';

    // Validate numQuestions (1-20)
    const questionCount = Math.min(Math.max(parseInt(numQuestions) || 10, 1), 20);

    const quiz = await AIService.generateQuizFromMaterial(materialId, classId, req.user.id, {
      numQuestions: questionCount,
      difficulty: normalizedDifficulty,
    });

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/generate-quiz-from-text
 * Generate quiz questions from raw text content
 * Body: { classId, content, title, numQuestions, difficulty }
 */
router.post('/generate-quiz-from-text', async (req, res) => {
  try {
    const { classId, content, title = 'Custom Quiz', numQuestions = 10, difficulty = 'medium' } = req.body;

    if (!classId || !content) {
      return res.status(400).json({ success: false, message: 'classId and content are required' });
    }

    const quiz = await AIService.generateQuizFromText(classId, req.user.id, content, {
      title,
      numQuestions: Math.min(Math.max(parseInt(numQuestions) || 10, 1), 20),
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
    });

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Generate quiz from text error:', error);
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

    const result = await AIService.summarizeMaterial(materialId);
    res.json({ success: true, data: result });
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

/**
 * GET /api/ai/quiz-difficulty/:quizId
 * Analyze quiz difficulty based on student attempts
 */
router.get('/quiz-difficulty/:quizId', async (req, res) => {
  try {
    const analysis = await AIService.analyzeQuizDifficulty(req.params.quizId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analyze quiz difficulty error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/ai/health
 * Check if AI service is configured and working
 */
router.get('/health', async (req, res) => {
  try {
    const hasApiKey = !!process.env.AIML_API_KEY;
    const keyPreview = hasApiKey 
      ? `${process.env.AIML_API_KEY.slice(0, 8)}...` 
      : 'NOT SET';

    res.json({ 
      success: true, 
      data: {
        configured: hasApiKey,
        apiKeyPreview: keyPreview,
        status: hasApiKey ? 'ready' : 'missing_api_key',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

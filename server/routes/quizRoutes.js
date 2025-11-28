import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import QuizServiceSupabase from '../services/quizServiceSupabase.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * POST /api/quizzes
 * Create a new quiz
 */
router.post('/', async (req, res) => {
  try {
    const { class_id, classId, title, description, time_limit, is_adaptive } = req.body;
    const finalClassId = class_id || classId;

    if (!finalClassId || !title) {
      return res.status(400).json({ success: false, message: 'class_id and title are required' });
    }

    const quiz = await QuizServiceSupabase.createQuiz(finalClassId, req.user.id, {
      title,
      description,
      time_limit: time_limit || 30,
      is_adaptive: is_adaptive || false,
    });

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/class/:classId
 * Get all quizzes for a class (new route)
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const quizzes = await QuizServiceSupabase.getClassQuizzes(req.params.classId);
    res.json({ success: true, data: quizzes || [] });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/:classId
 * Get all quizzes for a class (legacy route)
 */
router.get('/:classId', async (req, res) => {
  try {
    const quizzes = await QuizServiceSupabase.getClassQuizzes(req.params.classId);
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/detail/:id
 * Get quiz detail with questions
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const quiz = await QuizServiceSupabase.getQuizDetail(req.params.id);
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Get quiz detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/quizzes/:id
 * Update a quiz
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, description } = req.body;

    const updated = await QuizServiceSupabase.updateQuiz(req.params.id, {
      title,
      description,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Delete a quiz
 */
router.delete('/:id', async (req, res) => {
  try {
    await QuizServiceSupabase.deleteQuiz(req.params.id);
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quizzes/:id/questions
 * Add a question to quiz
 */
router.post('/:id/questions', async (req, res) => {
  try {
    // Accept both naming conventions from frontend
    const { 
      question, question_text,
      options, 
      correctAnswer, correct_answer,
      difficulty,
      points
    } = req.body;

    const questionText = question || question_text;
    const answer = correctAnswer !== undefined ? correctAnswer : correct_answer;

    if (!questionText || !difficulty) {
      return res.status(400).json({ 
        success: false, 
        message: 'question and difficulty are required' 
      });
    }

    const newQuestion = await QuizServiceSupabase.addQuestion(req.params.id, {
      question: questionText,
      options: options || [],
      correctAnswer: answer,
      difficulty,
      points: points || 10,
    });

    res.json({ success: true, data: newQuestion });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/quizzes/questions/:questionId
 * Update a question
 */
router.put('/questions/:questionId', async (req, res) => {
  try {
    const updated = await QuizServiceSupabase.updateQuestion(req.params.questionId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/quizzes/questions/:questionId
 * Delete a question
 */
router.delete('/questions/:questionId', async (req, res) => {
  try {
    await QuizServiceSupabase.deleteQuestion(req.params.questionId);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quizzes/:id/publish
 * Publish a quiz
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const published = await QuizServiceSupabase.publishQuiz(req.params.id);
    res.json({ success: true, data: published });
  } catch (error) {
    console.error('Publish quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

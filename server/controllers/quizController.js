import QuizResult from '../models/QuizResult.js';
import quizService from '../services/quizService.js';
import { generateRecommendations } from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

const { getQuestionByDifficulty, getNextDifficulty, calculateScore, questionBank } = quizService;

// In-memory storage for active quiz sessions (in production, use Redis or DB)
const activeSessions = new Map();

/**
 * Start a new quiz session
 */
export const startQuiz = async (req, res) => {
  try {
    const quizId = uuidv4();
    
    // Initialize quiz session
    const session = {
      quizId,
      currentQuestionNumber: 1,
      totalQuestions: 10,
      answers: [],
      currentDifficulty: 'easy',
      askedQuestions: [],
    };
    
    // Get first question
    const firstQuestion = getQuestionByDifficulty('easy');
    session.askedQuestions.push(firstQuestion.id);
    
    // Store session
    activeSessions.set(quizId, session);
    
    // Return question without the correct answer
    const { correctAnswer, ...questionForClient } = firstQuestion;
    
    res.json({
      success: true,
      quizId,
      currentQuestion: questionForClient,
      questionNumber: 1,
      totalQuestions: 10,
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
    });
  }
};

/**
 * Submit an answer and get next question
 */
export const submitAnswer = async (req, res) => {
  try {
    const { quizId, questionId, answer } = req.body;
    
    // Get session
    const session = activeSessions.get(quizId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found',
      });
    }
    
    // Find the question to check if answer is correct
    const question = questionBank.find(q => q.id === questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }
    
    const isCorrect = answer === question.correctAnswer;
    
    // Store answer
    session.answers.push({
      questionId: question.id,
      question: question.question,
      selectedAnswer: answer,
      correctAnswer: question.correctAnswer,
      correct: isCorrect,
    });
    
    // Check if quiz is completed
    if (session.currentQuestionNumber >= session.totalQuestions) {
      // Quiz completed - save results and generate recommendations
      const scoreInfo = calculateScore(session.answers);
      
      // Generate AI recommendations
      const recommendations = await generateRecommendations({
        score: scoreInfo.score,
        totalQuestions: scoreInfo.totalQuestions,
        percentage: scoreInfo.percentage,
        answers: session.answers,
      });
      
      // Save to database
      const quizResult = new QuizResult({
        quizId,
        answers: session.answers,
        score: scoreInfo.score,
        totalQuestions: scoreInfo.totalQuestions,
        recommendations,
        completed: true,
      });
      
      await quizResult.save();
      
      // Clean up session
      activeSessions.delete(quizId);
      
      return res.json({
        success: true,
        completed: true,
        quizId,
      });
    }
    
    // Get next question with adaptive difficulty
    session.currentDifficulty = getNextDifficulty(isCorrect, session.currentDifficulty);
    const nextQuestion = getQuestionByDifficulty(session.currentDifficulty, session.askedQuestions);
    session.askedQuestions.push(nextQuestion.id);
    session.currentQuestionNumber++;
    
    // Update session
    activeSessions.set(quizId, session);
    
    // Return next question without correct answer
    const { correctAnswer, ...questionForClient } = nextQuestion;
    
    res.json({
      success: true,
      completed: false,
      nextQuestion: questionForClient,
      questionNumber: session.currentQuestionNumber,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
    });
  }
};

/**
 * Get quiz results
 */
export const getQuizResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await QuizResult.findOne({ quizId: id });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found',
      });
    }
    
    res.json({
      success: true,
      quizId: result.quizId,
      score: result.score,
      totalQuestions: result.totalQuestions,
      answers: result.answers,
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error('Get quiz result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz results',
    });
  }
};

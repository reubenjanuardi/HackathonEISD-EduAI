import express from 'express';
import { startQuiz, submitAnswer, getQuizResult } from '../controllers/quizController.js';

const router = express.Router();

router.get('/start', startQuiz);
router.post('/answer', submitAnswer);
router.get('/result/:id', getQuizResult);

export default router;

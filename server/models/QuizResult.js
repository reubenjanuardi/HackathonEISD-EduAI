import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
  },
  studentName: {
    type: String,
    default: 'Student',
  },
  answers: [{
    questionId: String,
    question: String,
    selectedAnswer: Number,
    correctAnswer: Number,
    correct: Boolean,
  }],
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  recommendations: [String],
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model('QuizResult', quizResultSchema);

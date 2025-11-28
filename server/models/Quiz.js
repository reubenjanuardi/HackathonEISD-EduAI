import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  questions: [{
    id: String,
    question: String,
    options: [String],
    correctAnswer: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    subject: String,
  }],
}, {
  timestamps: true,
});

export default mongoose.model('Quiz', quizSchema);

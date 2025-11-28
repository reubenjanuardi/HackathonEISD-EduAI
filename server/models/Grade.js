import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  insights: {
    type: String,
  },
});

export default mongoose.model('Grade', gradeSchema);

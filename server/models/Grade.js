import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  studentName: {
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
}, {
  timestamps: true,
});

export default mongoose.model('Grade', gradeSchema);

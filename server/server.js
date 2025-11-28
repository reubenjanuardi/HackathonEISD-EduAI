import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174'  // Alternative port when 5173 is in use
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EduAI Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduai';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Server will continue running, but database features will not work.');
    console.log('💡 To fix: Install MongoDB locally or use MongoDB Atlas');
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 EduAI Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log('\n⚠️  WARNING: Gemini API key not configured!');
      console.log('💡 Set GEMINI_API_KEY in your .env file to enable AI features');
    }
    
    console.log('\n📚 Available endpoints:');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/dashboard');
    console.log('   POST /api/grades/upload');
    console.log('   POST /api/grades/insights');
    console.log('   GET  /api/quiz/start');
    console.log('   POST /api/quiz/answer');
    console.log('   GET  /api/quiz/result/:id\n');
  });
};

startServer();

export default app;

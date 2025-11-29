import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes - Supabase based
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import { ensureQuestionTypeColumn, ensureAnswerTextField } from './services/migrationService.js';

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

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EduAI Server is running (Supabase)',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  // Check database schema
  console.log('\n🔍 Checking database schema...');
  const hasQuestionType = await ensureQuestionTypeColumn();
  const hasAnswerText = await ensureAnswerTextField();
  
  if (!hasQuestionType || !hasAnswerText) {
    console.log('\n⚠️  DATABASE SCHEMA NEEDS MIGRATION');
    console.log('Please execute the following SQL in your Supabase dashboard:');
    console.log('   1. ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT \'multiple_choice\';');
    console.log('   2. ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS student_answer_text TEXT;');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 EduAI Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('\n⚠️  WARNING: Supabase credentials not configured!');
      console.log('💡 Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
    }
    
    if (!process.env.AIML_API_KEY || process.env.AIML_API_KEY === 'your_aiml_api_key_here') {
      console.log('\n⚠️  WARNING: AI/ML API key not configured!');
      console.log('💡 Get your free API key at https://aimlapi.com/ and add it to your .env file');
    }
    
    console.log('\n📚 Available API Groups:');
    console.log('   🔐 /api/auth          - Authentication & profile');
    console.log('   📚 /api/classes       - Class management & enrollment');
    console.log('   📄 /api/materials     - Upload & manage course materials');
    console.log('   ❓ /api/quizzes      - Quiz CRUD operations');
    console.log('   ✅ /api/attempts     - Quiz attempts & submissions');
    console.log('   📊 /api/analytics    - Class & quiz analytics');
    console.log('   🤖 /api/ai           - AI features (quiz generation, summarization)');
    console.log('   📥 /api/export       - Export grades & reports\n');
  });
};

startServer();

export default app;

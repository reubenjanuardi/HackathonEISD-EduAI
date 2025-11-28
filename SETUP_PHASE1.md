# Phase 1: Supabase Backend Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 16+ installed
- Supabase account (free tier available at supabase.com)
- AIML API key (free from aimlapi.com)

### 2. Environment Setup

Create `.env` file in `/server`:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AIML API
AIML_API_KEY=your-aiml-api-key

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**To get these values**:

#### Supabase Keys:
1. Go to [supabase.com](https://supabase.com)
2. Create new project or use existing
3. Settings → API → Copy:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_KEY`

#### AIML API Key:
1. Go to [aimlapi.com](https://aimlapi.com)
2. Sign up (free)
3. Copy your API key

### 3. Database Setup

#### Apply Migrations to Supabase

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `server/database/migrations/001_initial_schema.sql`
3. Run the entire query
4. Copy contents of `server/database/migrations/002_rls_policies.sql`
5. Run the entire query

**Option B: Using CLI (recommended)**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize in project
cd server/database
supabase init

# Link to your project
supabase link

# Apply migrations
supabase db pull  # Pull existing schema
supabase migration list
supabase db push  # Push all migrations
```

#### Verify Setup
In Supabase Dashboard → Table Editor, verify these tables exist:
- [ ] `users`
- [ ] `classes`
- [ ] `class_members`
- [ ] `materials`
- [ ] `quizzes`
- [ ] `quiz_questions`
- [ ] `quiz_attempts`
- [ ] `attempt_answers`
- [ ] `ai_insights`
- [ ] `student_progress`

### 4. Install Dependencies

```bash
cd server
npm install

# Key packages already included:
# - express
# - @supabase/supabase-js
# - cors
# - dotenv
# - multer (for file uploads)
```

### 5. Start Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 EduAI Server running on port 5000
📍 Health check: http://localhost:5000/api/health
🔗 API Base URL: http://localhost:5000/api
```

### 6. Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"EduAI Server is running (Supabase)","timestamp":"..."}
```

---

## Architecture Overview

### Layered Architecture

```
HTTP Requests
    ↓
Express Routes (/api/classes, /api/quizzes, etc.)
    ↓
Auth Middleware (getAuthUser from Supabase config)
    ↓
Service Layer (ClassService, QuizService, etc.)
    ↓
Supabase Client
    ↓
Supabase Database (with RLS policies)
    ↓
Data Returned → JSON Response
```

### Data Flow Example: Create Class

```
POST /api/classes
  ↓ (validate input)
ClassService.createClass()
  ↓ (build insert query)
supabase.from('classes').insert({...})
  ↓ (RLS policy checks: is user a teacher?)
Database executes query
  ↓ (returns created class)
Response sent to client: { success: true, data: class }
```

---

## API Overview

### Authentication Required ✅
All endpoints require valid Supabase auth token:
```javascript
// Add to requests:
headers: {
  'Authorization': `Bearer ${sessionToken}`
}
```

### Core Resources

**Classes** (Teacher manages, Students enroll)
```
POST   /api/classes              Create class
GET    /api/classes              List my classes
GET    /api/classes/:id          Class details + members
PUT    /api/classes/:id          Update class
DELETE /api/classes/:id          Delete class + cascade
POST   /api/classes/:id/enroll   Enroll student (admin)
DELETE /api/classes/:id/unenroll/:studentId - Remove student
POST   /api/classes/enroll-by-code - Student self-enrollment
```

**Materials** (Course content)
```
POST   /api/materials/upload     Upload file (PDF, video)
GET    /api/materials/:classId   List class materials
GET    /api/materials/detail/:id Get material + content
POST   /api/materials/:id/summarize - AI summary
DELETE /api/materials/:id        Delete material
```

**Quizzes** (Assessments)
```
POST   /api/quizzes              Create quiz
GET    /api/quizzes/:classId     List class quizzes
GET    /api/quizzes/detail/:id   Quiz + questions
PUT    /api/quizzes/:id          Update quiz
DELETE /api/quizzes/:id          Delete quiz
POST   /api/quizzes/:id/questions - Add question
PUT    /api/quizzes/questions/:questionId - Edit question
DELETE /api/quizzes/questions/:questionId - Delete question
POST   /api/quizzes/:id/publish  Publish quiz
```

**Attempts** (Student responses)
```
POST   /api/attempts             Start attempt
GET    /api/attempts/:attemptId  Get attempt details
POST   /api/attempts/:attemptId/answer - Submit answer
POST   /api/attempts/:attemptId/complete - Complete + score
GET    /api/attempts/quiz/:quizId - All quiz attempts
GET    /api/attempts/class/:classId/student - My attempts
DELETE /api/attempts/:attemptId  Delete attempt
```

**Analytics** (Performance tracking)
```
GET    /api/analytics/class/:classId - Class metrics
GET    /api/analytics/quiz/:quizId - Quiz stats
GET    /api/analytics/quiz/:quizId/difficulty - Question analysis
GET    /api/analytics/class/:classId/at-risk - Struggling students
POST   /api/analytics/student/:studentId/progress - Update
```

**AI Features** (Smart generation & insights)
```
POST   /api/ai/generate-quiz     AI quiz from material
POST   /api/ai/summarize-material - AI summary
GET    /api/ai/insights/:classId - Class insights
GET    /api/ai/student-recommendations/:classId - Recommendations
POST   /api/ai/generate-adaptive-quiz - Adaptive quiz
```

**Export** (Reports)
```
GET    /api/export/class/:classId/grades.csv
GET    /api/export/class/:classId/grades.xlsx
GET    /api/export/quiz/:quizId/results.csv
GET    /api/export/student/:studentId/transcript
GET    /api/export/class/:classId/analytics
```

---

## Example: Creating a Class Flow

### 1. Teacher Creates Class
```bash
POST /api/classes
Authorization: Bearer {teacher_token}
Content-Type: application/json

{
  "name": "Introduction to Python",
  "description": "Learn Python basics",
  "code": "PYTHON101"
}

Response:
{
  "success": true,
  "data": {
    "id": "class_123",
    "name": "Introduction to Python",
    "teacher_id": "user_456",
    "code": "PYTHON101",
    "created_at": "2024-01-15T..."
  }
}
```

### 2. Students Enroll Using Code
```bash
POST /api/classes/enroll-by-code
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "code": "PYTHON101"
}

Response:
{
  "success": true,
  "message": "Enrolled successfully",
  "data": { class details }
}
```

### 3. Teacher Uploads Material
```bash
POST /api/materials/upload
Authorization: Bearer {teacher_token}
Content-Type: multipart/form-data

form-data:
- file: lecture.pdf
- classId: class_123
- title: Lecture 1
- description: Introduction to variables

Response:
{
  "success": true,
  "data": {
    "id": "material_789",
    "url": "https://supabase.../lecture.pdf"
  }
}
```

### 4. Teacher Creates Quiz
```bash
POST /api/quizzes
Authorization: Bearer {teacher_token}

{
  "classId": "class_123",
  "title": "Module 1 Quiz",
  "description": "Test your knowledge"
}

Response:
{
  "success": true,
  "data": { quiz object }
}
```

### 5. Add Questions to Quiz
```bash
POST /api/quizzes/{quizId}/questions
Authorization: Bearer {teacher_token}

{
  "question": "What is Python?",
  "options": ["Language", "Snake", "IDE", "Library"],
  "correctAnswer": 0,
  "difficulty": "easy"
}
```

### 6. Publish Quiz
```bash
POST /api/quizzes/{quizId}/publish
Authorization: Bearer {teacher_token}

Response: { success: true, data: { ...quiz, is_published: true } }
```

### 7. Student Takes Quiz
```bash
# Start attempt
POST /api/attempts
Authorization: Bearer {student_token}

{
  "quizId": "quiz_123",
  "classId": "class_123"
}

Response: { success: true, data: { attemptId: "attempt_999" } }

# Submit answers
POST /api/attempts/{attemptId}/answer
{
  "questionId": "q1",
  "answer": 0
}

# Complete attempt
POST /api/attempts/{attemptId}/complete
Response: { success: true, data: { score: 85, passed: true } }
```

### 8. Teacher Views Analytics
```bash
GET /api/analytics/class/class_123
Authorization: Bearer {teacher_token}

Response:
{
  "success": true,
  "data": {
    "totalStudents": 25,
    "averageScore": 78.5,
    "classMetrics": { ... }
  }
}
```

---

## Troubleshooting

### "401 Unauthorized" on API calls
- ✅ Token missing from Authorization header
- ✅ Token expired
- ✅ Wrong token (student token on teacher endpoint)
- **Fix**: Ensure auth middleware runs on routes

### "Row-level security (RLS) violation" error
- ✅ User doesn't have permission for data
- ✅ RLS policy not configured correctly
- **Fix**: Check 002_rls_policies.sql is applied
- **Verify**: Supabase Dashboard → Authentication tab

### Material upload fails
- ✅ File too large
- ✅ Storage bucket not created
- **Fix**: Create `materials` bucket in Supabase Storage
- **Access**: Supabase → Storage → Create bucket

### AIML API returning 401
- ✅ Invalid API key
- ✅ API key not in .env
- **Fix**: Verify AIML_API_KEY in .env
- **Verify**: curl `https://api.aimlapi.com/status` with bearer token

### Database tables not showing
- ✅ Migrations not applied
- ✅ Wrong Supabase project
- **Fix**: Run migrations again
- **Verify**: Correct SUPABASE_URL in .env

---

## Testing Endpoints (Postman/cURL)

### Get Auth Token
Before making requests, you need a valid Supabase token:
```bash
# Supabase has built-in auth endpoints
# For local testing, manually create a token or use:
curl -X POST https://{SUPABASE_URL}/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "grant_type": "password"
  }'
```

### Test Class Creation
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Class",
    "description": "Testing API",
    "code": "TEST101"
  }'
```

---

## Next: Phase 2 - Frontend Implementation

Once backend is working, begin:
1. Frontend route protection
2. API client setup
3. State management (Zustand)
4. Teacher dashboard
5. Student dashboard
6. Quiz interface
7. Material viewer
8. Analytics dashboard

---

## Performance Considerations

✅ **Database**
- 15+ indexes on frequently queried columns
- RLS policies optimized for common queries
- Cascade deletes to prevent orphaned records

✅ **API**
- JSON responses compressed
- Pagination recommended for large datasets
- Caching headers set where appropriate

✅ **Storage**
- PDF/Video files in Supabase Storage (CDN)
- Direct file URLs returned (no proxying)

✅ **AI Features**
- AIML API calls cached where possible
- AI summaries stored to avoid regeneration
- Adaptive quiz difficulty based on cached progress

---

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Auth middleware on protected routes
- [ ] CORS restricted to frontend origin
- [ ] AIML key never exposed in frontend
- [ ] Service role key stored securely (backend only)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced in production

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **AIML API Docs**: https://aimlapi.com/docs
- **Express.js Guide**: https://expressjs.com

---

**Last Updated**: 2024  
**Phase**: 1 (Backend Infrastructure)  
**Status**: ✅ Ready for Testing

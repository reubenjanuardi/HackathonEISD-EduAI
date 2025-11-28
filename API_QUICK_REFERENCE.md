# API Quick Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except `/health`) require:
```
Authorization: Bearer {supabase_token}
```

---

## Classes
```
POST   /classes              Create class
GET    /classes              List my classes
GET    /classes/:id          Get class details
PUT    /classes/:id          Update class
DELETE /classes/:id          Delete class
POST   /classes/:id/enroll   Enroll student (admin)
DELETE /classes/:id/unenroll/:studentId - Remove student
POST   /classes/enroll-by-code - Self-enroll
```

## Materials
```
POST   /materials/upload     Upload file
GET    /materials/:classId   List materials
GET    /materials/detail/:id Get material
POST   /materials/:id/summarize - AI summary
DELETE /materials/:id        Delete material
```

## Quizzes
```
POST   /quizzes              Create quiz
GET    /quizzes/:classId     List quizzes
GET    /quizzes/detail/:id   Get quiz + questions
PUT    /quizzes/:id          Update quiz
DELETE /quizzes/:id          Delete quiz
POST   /quizzes/:id/questions - Add question
PUT    /quizzes/questions/:questionId - Update question
DELETE /quizzes/questions/:questionId - Delete question
POST   /quizzes/:id/publish  Publish quiz
```

## Quiz Attempts
```
POST   /attempts             Start attempt
GET    /attempts/:id         Get attempt
POST   /attempts/:id/answer  Submit answer
POST   /attempts/:id/complete - Complete & score
GET    /attempts/quiz/:quizId - Quiz attempts
GET    /attempts/class/:classId/student - My attempts
DELETE /attempts/:id         Delete attempt
```

## Analytics
```
GET    /analytics/class/:classId - Class metrics
GET    /analytics/quiz/:quizId - Quiz stats
GET    /analytics/quiz/:quizId/difficulty - Difficulty
GET    /analytics/class/:classId/at-risk - At-risk students
POST   /analytics/student/:studentId/progress - Update
```

## AI Features
```
POST   /ai/generate-quiz     AI quiz from material
POST   /ai/summarize-material - Summarize material
GET    /ai/insights/:classId - Class insights
GET    /ai/student-recommendations/:classId - Recommendations
POST   /ai/generate-adaptive-quiz - Adaptive quiz
```

## Export
```
GET    /export/class/:classId/grades.csv
GET    /export/class/:classId/grades.xlsx
GET    /export/quiz/:quizId/results.csv
GET    /export/student/:studentId/transcript
GET    /export/class/:classId/analytics
```

## Auth
```
POST   /auth/signup          Create account
POST   /auth/login           Login
POST   /auth/logout          Logout
GET    /auth/profile         Get profile
POST   /auth/reset-password  Reset password
```

## Health
```
GET    /health               Server status (no auth)
```

---

## Common Request Patterns

### Create Class
```json
POST /classes
{
  "name": "Class Name",
  "description": "Description",
  "code": "CLASS101"
}
```

### Upload Material
```
POST /materials/upload
Content-Type: multipart/form-data

- file: (binary)
- classId: (uuid)
- title: (string)
- description: (string)
```

### Create Quiz
```json
POST /quizzes
{
  "classId": "uuid",
  "title": "Quiz Name",
  "description": "Description"
}
```

### Add Question
```json
POST /quizzes/:id/questions
{
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "difficulty": "easy|medium|hard"
}
```

### Start Quiz Attempt
```json
POST /attempts
{
  "quizId": "uuid",
  "classId": "uuid"
}
```

### Submit Answer
```json
POST /attempts/:id/answer
{
  "questionId": "uuid",
  "answer": 0
}
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { /* results */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (RLS)
- `404` - Not Found
- `500` - Server Error

---

## Testing with cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Get Classes (with token)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/classes
```

### Create Class
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","code":"TEST"}' \
  http://localhost:5000/api/classes
```

### Upload Material
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@lecture.pdf" \
  -F "classId=uuid" \
  -F "title=Lecture" \
  http://localhost:5000/api/materials/upload
```

---

**Last Updated**: 2024  
**API Version**: 1.0  
**Environment**: Development

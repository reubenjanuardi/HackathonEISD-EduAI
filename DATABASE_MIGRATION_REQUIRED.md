# Database Schema Update Required

The quiz system now supports multiple question types (multiple choice, true/false, short answer). To enable this, you need to add two columns to your Supabase database.

## Steps to Update Your Database:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (HackathonEISD-EduAI or similar)
3. **Go to SQL Editor** (left sidebar)
4. **Create a new query** and paste the following SQL:

```sql
-- Add question_type column to quiz_questions table
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';

-- Add student_answer_text column to attempt_answers table for short answer/true-false responses
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS student_answer_text TEXT;
```

5. **Click "Run"** to execute the SQL
6. **Refresh your browser** after execution

## What These Changes Do:

- `question_type` in `quiz_questions`: Stores the type of question (multiple_choice, true_false, short_answer)
- `student_answer_text` in `attempt_answers`: Stores text responses for short answer and true/false questions (instead of just storing indices)

## After Running the Migration:

- Teachers can now create questions with different types from the Quiz Builder
- Students can answer short answer questions with text input
- Students can answer true/false questions with True/False buttons
- The Next button will work correctly across all question types

---

**Note**: The server will check these columns on startup and warn if they're missing.

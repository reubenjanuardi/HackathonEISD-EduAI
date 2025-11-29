-- Add question_type column to quiz_questions table
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';

-- Add student_answer_text for short answers
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS student_answer_text TEXT;

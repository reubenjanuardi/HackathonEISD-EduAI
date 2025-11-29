import { supabase } from '../config/supabase.js';

export const ensureQuestionTypeColumn = async () => {
  try {
    // Query the first question to check if question_type exists
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('question_type')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('question_type column does not exist. You need to run the migration manually in Supabase dashboard.');
      console.log('Migration SQL: ALTER TABLE quiz_questions ADD COLUMN question_type TEXT DEFAULT \'multiple_choice\';');
      return false;
    }

    console.log('question_type column exists');
    return true;
  } catch (error) {
    console.error('Error checking column:', error);
    return false;
  }
};

export const ensureAnswerTextField = async () => {
  try {
    // Query the first attempt answer to check if student_answer_text exists
    const { data, error } = await supabase
      .from('attempt_answers')
      .select('student_answer_text')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('student_answer_text column does not exist. You need to run the migration manually in Supabase dashboard.');
      console.log('Migration SQL: ALTER TABLE attempt_answers ADD COLUMN student_answer_text TEXT;');
      return false;
    }

    console.log('student_answer_text column exists');
    return true;
  } catch (error) {
    console.error('Error checking column:', error);
    return false;
  }
};

export default { ensureQuestionTypeColumn, ensureAnswerTextField };


import { supabase } from '../config/supabase.js';

class AttemptService {
  /**
   * Start a quiz attempt
   */
  static async startAttempt(quizId, studentId) {
    // Check if student already has an attempt
    const { data: existing } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      throw new Error('Student already has an attempt for this quiz');
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        quiz_id: quizId,
        student_id: studentId,
      }])
      .select();

    if (error) throw new Error(`Failed to start attempt: ${error.message}`);
    return data?.[0];
  }

  /**
   * Submit an answer to a question
   */
  static async submitAnswer(attemptId, questionId, studentAnswer, correct) {
    const { data, error } = await supabase
      .from('attempt_answers')
      .insert([{
        attempt_id: attemptId,
        question_id: questionId,
        student_answer: studentAnswer,
        correct,
      }])
      .select();

    if (error) throw new Error(`Failed to submit answer: ${error.message}`);
    return data?.[0];
  }

  /**
   * Complete a quiz attempt and calculate score
   */
  static async completeAttempt(attemptId) {
    // Get all answers for this attempt
    const { data: answers, error: answerError } = await supabase
      .from('attempt_answers')
      .select('correct')
      .eq('attempt_id', attemptId);

    if (answerError) throw new Error(`Failed to fetch answers: ${answerError.message}`);

    const correctCount = answers.filter(a => a.correct).length;
    const totalQuestions = answers.length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Update attempt with scores
    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        score: correctCount,
        total_questions: totalQuestions,
        percentage: percentage.toFixed(2),
        completed_at: new Date(),
      })
      .eq('id', attemptId)
      .select();

    if (error) throw new Error(`Failed to complete attempt: ${error.message}`);
    return data?.[0];
  }

  /**
   * Get student's attempt for a quiz
   */
  static async getAttempt(quizId, studentId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        attempt_answers (
          id,
          question_id,
          student_answer,
          correct,
          quiz_questions (question, options, correct_answer)
        )
      `)
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all attempts for a quiz (for teacher)
   */
  static async getQuizAttempts(quizId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        users:student_id (id, name, email)
      `)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch attempts: ${error.message}`);
    return data;
  }

  /**
   * Get student's attempts in a class
   */
  static async getStudentClassAttempts(classId, studentId) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (id, title, class_id)
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch attempts: ${error.message}`);

    // Filter by class
    return data?.filter(attempt => attempt.quizzes.class_id === classId) || [];
  }

  /**
   * Delete an attempt
   */
  static async deleteAttempt(attemptId) {
    const { error } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', attemptId);

    if (error) throw new Error(`Failed to delete attempt: ${error.message}`);
    return true;
  }
}

export default AttemptService;

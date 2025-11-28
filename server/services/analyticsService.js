import { supabase } from '../config/supabase.js';

class AnalyticsService {
  /**
   * Get class-level analytics
   */
  static async getClassAnalytics(classId) {
    // Get all quizzes in class
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('class_id', classId);

    const quizIds = quizzes?.map(q => q.id) || [];

    if (quizIds.length === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        totalAttempts: 0,
        quizPerformance: [],
        topicPerformance: {},
      };
    }

    // Get all attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .in('quiz_id', quizIds);

    // Calculate metrics
    const totalAttempts = attempts?.length || 0;
    const averageScore = totalAttempts > 0
      ? (attempts?.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts).toFixed(2)
      : 0;

    // Get unique students
    const uniqueStudents = new Set(attempts?.map(a => a.student_id) || []);
    const totalStudents = uniqueStudents.size;

    return {
      totalStudents,
      averageScore,
      totalAttempts,
      quizPerformance: attempts || [],
    };
  }

  /**
   * Get quiz-level analytics
   */
  static async getQuizAnalytics(quizId) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId);

    if (!attempts || attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        completionRate: 0,
      };
    }

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed_at).length;
    const scores = attempts.map(a => a.percentage || 0);

    return {
      totalAttempts,
      completedAttempts,
      completionRate: ((completedAttempts / totalAttempts) * 100).toFixed(2),
      averageScore: (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      attempts,
    };
  }

  /**
   * Get question difficulty analysis
   */
  static async getQuestionDifficultyAnalysis(quizId) {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (!questions) return [];

    const analysis = [];
    for (const question of questions) {
      const { data: answers } = await supabase
        .from('attempt_answers')
        .select('correct')
        .eq('question_id', question.id);

      const correctCount = answers?.filter(a => a.correct).length || 0;
      const totalAttempts = answers?.length || 0;
      const correctPercentage = totalAttempts > 0 
        ? ((correctCount / totalAttempts) * 100).toFixed(2)
        : 0;

      analysis.push({
        questionId: question.id,
        question: question.question,
        difficulty: question.difficulty,
        correctPercentage,
        totalAttempts,
      });
    }

    return analysis;
  }

  /**
   * Identify at-risk students in a class
   */
  static async getAtRiskStudents(classId, threshold = 50) {
    const { data: members } = await supabase
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId);

    if (!members) return [];

    const atRiskStudents = [];

    for (const member of members) {
      const { data: studentProgress } = await supabase
        .from('student_progress')
        .select('average_score, quizzes_attempted')
        .eq('student_id', member.student_id)
        .eq('class_id', classId)
        .single();

      if (studentProgress && studentProgress.average_score < threshold) {
        const { data: user } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', member.student_id)
          .single();

        atRiskStudents.push({
          ...user,
          averageScore: studentProgress.average_score,
          attemptsCount: studentProgress.quizzes_attempted,
        });
      }
    }

    return atRiskStudents;
  }

  /**
   * Update student progress
   */
  static async updateStudentProgress(studentId, classId, quizAttempts) {
    const totalAttempts = quizAttempts.length;
    const averageScore = totalAttempts > 0
      ? (quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts).toFixed(2)
      : 0;

    const { data, error } = await supabase
      .from('student_progress')
      .upsert([{
        student_id: studentId,
        class_id: classId,
        quizzes_attempted: totalAttempts,
        average_score: averageScore,
        last_attempt_at: new Date(),
      }], { onConflict: 'student_id,class_id' })
      .select();

    if (error) throw new Error(`Failed to update progress: ${error.message}`);
    return data?.[0];
  }
}

export default AnalyticsService;

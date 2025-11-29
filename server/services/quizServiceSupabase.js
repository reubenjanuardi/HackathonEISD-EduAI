import { supabase } from '../config/supabase.js';

class QuizServiceSupabase {
  /**
   * Create a new quiz
   */
  static async createQuiz(classId, userId, { title, description, time_limit, is_adaptive }) {
    const { data, error } = await supabase
      .from('quizzes')
      .insert([{
        class_id: classId,
        title,
        description,
        created_by: userId,
        published: false,
      }])
      .select();

    if (error) throw new Error(`Failed to create quiz: ${error.message}`);
    
    // Add time_limit and is_adaptive to response even if not in DB
    const quiz = data?.[0];
    if (quiz) {
      quiz.time_limit = time_limit || 30;
      quiz.is_adaptive = is_adaptive || false;
      quiz.is_published = quiz.published;
      quiz.questions = [];
    }
    return quiz;
  }

  /**
   * Get all quizzes for a class
   */
  static async getClassQuizzes(classId) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          id,
          question,
          options,
          correct_answer,
          difficulty,
          order_num
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch quizzes: ${error.message}`);
    
    // Normalize field names for frontend
    return (data || []).map(quiz => ({
      ...quiz,
      is_published: quiz.published,
      time_limit: quiz.time_limit || 30,
      is_adaptive: quiz.is_adaptive || false,
      questions: (quiz.quiz_questions || []).map(q => ({
        ...q,
        question_text: q.question,
        question_type: q.question_type || 'multiple_choice',
        points: 10
      }))
    }));
  }

  /**
   * Get quiz detail with questions
   */
  static async getQuizDetail(quizId) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          id,
          question,
          options,
          correct_answer,
          difficulty,
          order_num
        )
      `)
      .eq('id', quizId)
      .single();

    if (error) throw new Error(`Failed to fetch quiz: ${error.message}`);
    
    // Normalize for frontend
    return {
      ...data,
      is_published: data.published,
      time_limit: data.time_limit || 30,
      is_adaptive: data.is_adaptive || false,
      questions: (data.quiz_questions || []).map(q => ({
        ...q,
        question_text: q.question,
        question_type: q.question_type || 'multiple_choice',
        points: 10 // Default points
      }))
    };
  }

  /**
   * Add a question to a quiz
   */
  static async addQuestion(quizId, { question, options, correctAnswer, difficulty, points, question_type }) {
    // Get next order number
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('order_num')
      .eq('quiz_id', quizId)
      .order('order_num', { ascending: false })
      .limit(1);

    const nextOrder = (questions?.[0]?.order_num || 0) + 1;

    // Build insert object - include question_type only if provided
    const insertObj = {
      quiz_id: quizId,
      question,
      options: options || [],
      correct_answer: typeof correctAnswer === 'number' ? correctAnswer : 0,
      difficulty,
      order_num: nextOrder,
    };

    // Only add question_type if it's explicitly provided
    if (question_type) {
      insertObj.question_type = question_type;
    }

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([insertObj])
      .select();

    if (error) throw new Error(`Failed to add question: ${error.message}`);
    
    // Add points and normalize response
    const questionData = data?.[0];
    if (questionData) {
      questionData.points = points || 10;
      questionData.question_text = questionData.question;
      questionData.question_type = questionData.question_type || 'multiple_choice';
    }
    return questionData;
  }

  /**
   * Update a quiz question
   */
  static async updateQuestion(questionId, updates) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(updates)
      .eq('id', questionId)
      .select();

    if (error) throw new Error(`Failed to update question: ${error.message}`);
    return data?.[0];
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(questionId) {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw new Error(`Failed to delete question: ${error.message}`);
    return true;
  }

  /**
   * Publish a quiz
   */
  static async publishQuiz(quizId) {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ published: true })
      .eq('id', quizId)
      .select();

    if (error) throw new Error(`Failed to publish quiz: ${error.message}`);
    
    const quiz = data?.[0];
    if (quiz) {
      quiz.is_published = quiz.published;
    }
    return quiz;
  }

  /**
   * Update quiz
   */
  static async updateQuiz(quizId, updates) {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', quizId)
      .select();

    if (error) throw new Error(`Failed to update quiz: ${error.message}`);
    return data?.[0];
  }

  /**
   * Delete a quiz
   */
  static async deleteQuiz(quizId) {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) throw new Error(`Failed to delete quiz: ${error.message}`);
    return true;
  }
}

export default QuizServiceSupabase;

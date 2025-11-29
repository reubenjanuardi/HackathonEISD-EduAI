import { supabase } from '../config/supabase.js';

/**
 * Detect question type from options array
 * - True/False: options are ["True", "False"] or similar
 * - Short Answer: options is empty, null, or has exactly 1 item (stored answer)
 * - Multiple Choice: options has 2+ items that aren't true/false
 */
function detectQuestionType(options) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return 'short_answer';
  }
  
  // Single option = short answer (answer is stored in options[0])
  if (options.length === 1) {
    return 'short_answer';
  }
  
  const normalized = options.map(o => String(o).toLowerCase().trim());
  if (normalized.length === 2 && 
      ((normalized[0] === 'true' && normalized[1] === 'false') ||
       (normalized[0] === 'benar' && normalized[1] === 'salah') ||
       (normalized[0] === 'yes' && normalized[1] === 'no'))) {
    return 'true_false';
  }
  
  return 'multiple_choice';
}

/**
 * Convert correct answer to storable format
 * For multiple choice: returns index
 * For true/false: returns 0 (true) or 1 (false)  
 * For short answer: returns 0 (we store answer text in options[0])
 */
function convertAnswerForStorage(correctAnswer, options, questionType) {
  if (questionType === 'short_answer') {
    return 0;
  }
  
  if (questionType === 'true_false') {
    const answer = String(correctAnswer).toLowerCase();
    if (answer === 'true' || answer === 'benar' || answer === 'yes' || answer === '0') {
      return 0;
    }
    return 1;
  }
  
  if (typeof correctAnswer === 'number') {
    return correctAnswer;
  }
  
  if (typeof correctAnswer === 'string' && options && Array.isArray(options)) {
    const idx = options.findIndex(opt => opt === correctAnswer);
    return idx >= 0 ? idx : 0;
  }
  
  return 0;
}

/**
 * Convert stored answer index back to display text
 */
function convertAnswerForDisplay(correctAnswerIndex, options, questionType) {
  if (questionType === 'short_answer') {
    return options && options[0] ? options[0] : '';
  }
  
  if (questionType === 'true_false') {
    return correctAnswerIndex === 0 ? 'True' : 'False';
  }
  
  if (options && Array.isArray(options) && options[correctAnswerIndex]) {
    return options[correctAnswerIndex];
  }
  
  return String(correctAnswerIndex);
}

/**
 * Prepare options for storage based on question type
 */
function prepareOptionsForStorage(options, correctAnswer, questionType) {
  if (questionType === 'true_false') {
    return ['True', 'False'];
  }
  
  if (questionType === 'short_answer') {
    return [String(correctAnswer || '')];
  }
  
  return (options || []).filter(o => o && String(o).trim());
}

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
        quiz_questions (*)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch quizzes:', error);
      throw new Error(`Failed to fetch quizzes: ${error.message}`);
    }
    
    return (data || []).map(quiz => ({
      ...quiz,
      is_published: quiz.published,
      time_limit: quiz.time_limit || 30,
      is_adaptive: quiz.is_adaptive || false,
      questions: (quiz.quiz_questions || []).map(q => {
        // Use stored question_type or detect from options
        const qType = q.question_type || detectQuestionType(q.options);
        const correctAnswerText = convertAnswerForDisplay(q.correct_answer, q.options, qType);
        
        // For short answer, hide options from display
        let displayOptions = q.options || [];
        if (qType === 'short_answer') {
          displayOptions = [];
        }
        
        return {
          id: q.id,
          question_text: q.question,
          question_type: qType,
          options: displayOptions,
          correct_answer: correctAnswerText,
          difficulty: q.difficulty || 'medium',
          points: 10,
          order_num: q.order_num
        };
      })
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
        quiz_questions (*)
      `)
      .eq('id', quizId)
      .single();

    if (error) {
      console.error('Failed to fetch quiz detail:', error);
      throw new Error(`Failed to fetch quiz: ${error.message}`);
    }
    
    return {
      ...data,
      is_published: data.published,
      time_limit: data.time_limit || 30,
      is_adaptive: data.is_adaptive || false,
      questions: (data.quiz_questions || []).map(q => {
        // Use stored question_type or detect from options
        const qType = q.question_type || detectQuestionType(q.options);
        const correctAnswerText = convertAnswerForDisplay(q.correct_answer, q.options, qType);
        
        // For short answer, hide options from display
        let displayOptions = q.options || [];
        if (qType === 'short_answer') {
          displayOptions = [];
        }
        
        return {
          id: q.id,
          question_text: q.question,
          question_type: qType,
          options: displayOptions,
          correct_answer: correctAnswerText,
          difficulty: q.difficulty || 'medium',
          points: 10,
          order_num: q.order_num
        };
      })
    };
  }

  /**
   * Add a question to a quiz
   */
  static async addQuestion(quizId, { question, question_type, options, correctAnswer, difficulty, points }) {
    // Get next order number
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('order_num')
      .eq('quiz_id', quizId)
      .order('order_num', { ascending: false })
      .limit(1);

    const nextOrder = (questions?.[0]?.order_num || 0) + 1;
    
    // Prepare options and correct answer based on question type
    const qType = question_type || 'multiple_choice';
    const storageOptions = prepareOptionsForStorage(options, correctAnswer, qType);
    const storageAnswer = convertAnswerForStorage(correctAnswer, storageOptions, qType);

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([{
        quiz_id: quizId,
        question,
        question_type: qType,
        options: storageOptions,
        correct_answer: storageAnswer,
        difficulty,
        order_num: nextOrder,
      }])
      .select();

    if (error) throw new Error(`Failed to add question: ${error.message}`);
    
    // Add points to response
    const questionData = data?.[0];
    if (questionData) {
      questionData.question_text = questionData.question;
      questionData.points = points || 10;
      // Convert correct answer back to display format
      questionData.correct_answer = convertAnswerForDisplay(
        questionData.correct_answer,
        questionData.options,
        qType
      );
    }
    return questionData;
  }

  /**
   * Update a quiz question
   */
  static async updateQuestion(questionId, updates) {
    const dbUpdates = {};
    
    if (updates.question_text !== undefined) {
      dbUpdates.question = updates.question_text;
    }
    if (updates.question !== undefined) {
      dbUpdates.question = updates.question;
    }
    if (updates.difficulty !== undefined) {
      dbUpdates.difficulty = updates.difficulty;
    }
    
    // Handle options and correct answer based on question type
    const qType = updates.question_type || 'multiple_choice';
    const correctAnswer = updates.correct_answer ?? updates.correctAnswer;
    
    if (updates.options !== undefined || correctAnswer !== undefined) {
      const storageOptions = prepareOptionsForStorage(updates.options, correctAnswer, qType);
      dbUpdates.options = storageOptions;
      
      if (correctAnswer !== undefined) {
        dbUpdates.correct_answer = convertAnswerForStorage(correctAnswer, storageOptions, qType);
      }
    }

    const { data, error } = await supabase
      .from('quiz_questions')
      .update(dbUpdates)
      .eq('id', questionId)
      .select();

    if (error) throw new Error(`Failed to update question: ${error.message}`);
    
    const questionData = data?.[0];
    if (questionData) {
      const detectedType = detectQuestionType(questionData.options);
      questionData.question_text = questionData.question;
      questionData.question_type = detectedType;
      questionData.points = updates.points || 10;
      questionData.correct_answer = convertAnswerForDisplay(
        questionData.correct_answer,
        questionData.options,
        detectedType
      );
      
      if (detectedType === 'short_answer') {
        questionData.options = [];
      }
    }
    return questionData;
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

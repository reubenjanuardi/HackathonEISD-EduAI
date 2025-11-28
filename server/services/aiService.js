import { supabase } from '../config/supabase.js';

class AIService {
  /**
   * Generate quiz questions from material using AIML API
   */
  static async generateQuizFromMaterial(materialId, classId, teacherId, options = {}) {
    try {
      const { numQuestions = 10, difficulty = 'medium' } = options;

      // Get material details
      const { data: material, error: matError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (matError) throw new Error(`Material not found: ${matError.message}`);

      // Get material content/text
      const materialContent = material.description || '';

      // Call AIML API to generate questions
      const aiResponse = await fetch('https://api.aimlapi.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assessment designer. Generate quiz questions based on provided material. Return response as valid JSON array of questions with this structure: [{question: string, options: [string, string, string, string], correctAnswer: number, difficulty: string}]',
            },
            {
              role: 'user',
              content: `Generate ${numQuestions} ${difficulty} difficulty quiz questions based on this material:\n\n${materialContent}\n\nRespond ONLY with valid JSON array, no markdown formatting.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AIML API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const generatedQuestions = JSON.parse(aiData.choices[0].message.content);

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          title: `AI Generated: ${material.title}`,
          description: `Automatically generated from material: ${material.title}`,
          is_published: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (quizError) throw new Error(`Quiz creation error: ${quizError.message}`);

      // Add questions to quiz
      const questions = [];
      for (const q of generatedQuestions) {
        const { data: question, error: qError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            difficulty: q.difficulty,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (qError) throw new Error(`Question creation error: ${qError.message}`);
        questions.push(question);
      }

      return {
        ...quiz,
        questions,
      };
    } catch (error) {
      console.error('Generate quiz error:', error);
      throw error;
    }
  }

  /**
   * Generate AI summary for material
   */
  static async summarizeMaterial(materialId) {
    try {
      const { data: material, error: matError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (matError) throw new Error(`Material not found: ${matError.message}`);

      const materialContent = material.description || '';

      // Call AIML API to generate summary
      const aiResponse = await fetch('https://api.aimlapi.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator. Generate a concise, clear summary of educational material in 150-200 words.',
            },
            {
              role: 'user',
              content: `Please summarize this material:\n\n${materialContent}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AIML API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const summary = aiData.choices[0].message.content;

      // Store summary
      const { data: updated, error: updateError } = await supabase
        .from('materials')
        .update({
          ai_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', materialId)
        .select()
        .single();

      if (updateError) throw new Error(`Update error: ${updateError.message}`);

      return {
        materialId,
        summary,
        material: updated,
      };
    } catch (error) {
      console.error('Summarize material error:', error);
      throw error;
    }
  }

  /**
   * Get AI insights for class
   */
  static async getClassInsights(classId) {
    try {
      // Get class analytics
      const { data: quizzes, error: qError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('class_id', classId);

      if (qError) throw new Error(`Quiz query error: ${qError.message}`);

      // Get attempts for all quizzes
      const quizIds = quizzes.map(q => q.id);
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('quiz_id', quizIds);

      if (aError) throw new Error(`Attempt query error: ${aError.message}`);

      // Calculate insights
      const avgScore = attempts.length > 0 
        ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(2)
        : 0;

      const lowPerformanceAttempts = attempts.filter(a => a.score < 60).length;
      const performancePercentage = attempts.length > 0 
        ? ((lowPerformanceAttempts / attempts.length) * 100).toFixed(1)
        : 0;

      // AI-generated insights
      const insightPrompt = `
        Class Performance Summary:
        - Total Quizzes: ${quizzes.length}
        - Total Attempts: ${attempts.length}
        - Average Score: ${avgScore}%
        - Low Performance Rate: ${performancePercentage}%
        
        Based on this data, provide 2-3 key insights for teachers on areas needing improvement.
      `;

      const aiResponse = await fetch('https://api.aimlapi.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an educational data analyst. Provide actionable insights for teachers.',
            },
            {
              role: 'user',
              content: insightPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AIML API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const insights = aiData.choices[0].message.content;

      return {
        classId,
        metrics: {
          totalQuizzes: quizzes.length,
          totalAttempts: attempts.length,
          averageScore: parseFloat(avgScore),
          lowPerformanceRate: parseFloat(performancePercentage),
        },
        aiInsights: insights,
      };
    } catch (error) {
      console.error('Get insights error:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations for student
   */
  static async getStudentRecommendations(classId, studentId) {
    try {
      // Get student's attempts in class
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quiz_id (
            id,
            title,
            description
          )
        `)
        .eq('student_id', studentId)
        .eq('quiz:quiz_id.class_id', classId);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      // Analyze weak areas
      const avgScore = attempts.length > 0 
        ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(1)
        : 0;

      const recommendation = `
        Student Performance Data:
        - Attempts: ${attempts.length}
        - Average Score: ${avgScore}%
        
        Provide personalized learning recommendations for this student.
      `;

      const aiResponse = await fetch('https://api.aimlapi.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a personalized learning advisor. Provide specific, actionable recommendations.',
            },
            {
              role: 'user',
              content: recommendation,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AIML API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const recommendations = aiData.choices[0].message.content;

      return {
        studentId,
        classId,
        performanceMetrics: {
          attemptCount: attempts.length,
          averageScore: parseFloat(avgScore),
        },
        recommendations,
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  }

  /**
   * Generate adaptive quiz based on student performance
   */
  static async generateAdaptiveQuiz(classId, studentId, topicId) {
    try {
      // Get student's recent performance on topic
      const { data: progress, error: pError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single();

      if (pError) throw new Error(`Progress query error: ${pError.message}`);

      // Determine difficulty based on performance
      let difficulty = 'medium';
      if (progress.average_score > 80) {
        difficulty = 'hard';
      } else if (progress.average_score < 60) {
        difficulty = 'easy';
      }

      // Generate quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          class_id: classId,
          teacher_id: progress.teacher_id,
          title: `Adaptive Quiz - ${topicId}`,
          description: `Adaptive quiz generated based on your performance`,
          is_published: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (quizError) throw new Error(`Quiz creation error: ${quizError.message}`);

      // Generate questions with appropriate difficulty
      const prompt = `Generate 5 ${difficulty} difficulty quiz questions on topic: ${topicId}. 
        Return as JSON array: [{question: string, options: [string, string, string, string], correctAnswer: number, difficulty: string}]
        Respond ONLY with valid JSON, no markdown.`;

      const aiResponse = await fetch('https://api.aimlapi.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assessment designer.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AIML API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const generatedQuestions = JSON.parse(aiData.choices[0].message.content);

      // Add questions to quiz
      const questions = [];
      for (const q of generatedQuestions) {
        const { data: question, error: qError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            difficulty: q.difficulty,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (qError) throw new Error(`Question error: ${qError.message}`);
        questions.push(question);
      }

      return {
        quiz,
        questions,
        adaptiveDifficulty: difficulty,
        studentPerformance: progress.average_score,
      };
    } catch (error) {
      console.error('Generate adaptive quiz error:', error);
      throw error;
    }
  }
}

export default AIService;

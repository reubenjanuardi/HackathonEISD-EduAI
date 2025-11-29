import { supabase } from '../config/supabase.js';

// ============================================
// AIML PROMPT TEMPLATES
// ============================================
const PROMPTS = {
  // Quiz Generation Prompt
  quizGeneration: (content, numQuestions, difficulty) => ({
    system: `You are an expert educational assessment designer specializing in creating high-quality multiple-choice questions. 
Your task is to generate quiz questions that:
- Test understanding, not just memorization
- Have clear, unambiguous correct answers
- Include plausible distractors (wrong options)
- Match the specified difficulty level
- Cover key concepts from the provided material

Return ONLY a valid JSON array with this exact structure:
[{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "difficulty": "easy|medium|hard"
}]

IMPORTANT: correctAnswer is a 0-based index (0-3) indicating which option is correct.
Do NOT include any markdown formatting, code blocks, or explanatory text.`,
    user: `Generate ${numQuestions} ${difficulty} difficulty multiple-choice questions based on this educational material:

---
${content}
---

Remember: Return ONLY the JSON array, no other text.`
  }),

  // Material Summarization Prompt
  materialSummary: (content) => ({
    system: `You are an expert educator skilled at distilling complex information into clear, student-friendly summaries.
Create summaries that:
- Highlight the most important concepts
- Use clear, accessible language
- Organize information logically
- Include key terms and definitions
- Are concise but comprehensive (150-250 words)`,
    user: `Summarize the following educational material into 5 clear bullet points, followed by a brief paragraph overview:

---
${content}
---`
  }),

  // Teacher Insights Prompt
  teacherInsights: (data) => ({
    system: `You are an educational data analyst helping teachers improve their instruction.
Analyze class performance data and provide:
- Key insights about student understanding
- Identification of struggling areas
- Specific, actionable recommendations
- Patterns or trends in the data

Be constructive and solution-focused. Format your response with clear sections.`,
    user: `Analyze this class quiz performance data and provide insights for the teacher:

Class Performance Summary:
- Total Quizzes: ${data.totalQuizzes}
- Total Attempts: ${data.totalAttempts}
- Average Score: ${data.averageScore}%
- Low Performance Rate (below 60%): ${data.lowPerformanceRate}%
- High Performance Rate (above 80%): ${data.highPerformanceRate}%

${data.questionAnalysis ? `Question-Level Analysis:\n${data.questionAnalysis}` : ''}

Provide:
1. Key Insights (2-3 main observations)
2. Areas Needing Attention
3. Recommended Actions for Improvement`
  }),

  // Student Recommendation Prompt
  studentRecommendation: (data) => ({
    system: `You are a personalized learning advisor helping students improve their academic performance.
Provide recommendations that are:
- Specific and actionable
- Encouraging and supportive
- Based on the student's actual performance data
- Focused on improvement strategies

Be positive but honest about areas needing work.`,
    user: `Based on this student's performance data, provide personalized learning recommendations:

Student Performance:
- Quizzes Attempted: ${data.attemptCount}
- Average Score: ${data.averageScore}%
- Best Performance: ${data.bestScore || 'N/A'}%
- Areas of Strength: ${data.strengths || 'To be determined with more attempts'}
- Areas for Improvement: ${data.weaknesses || 'To be determined with more attempts'}

Provide:
1. 3 Specific Learning Recommendations
2. Study Strategy Suggestions
3. Motivational Encouragement`
  }),

  // Adaptive Quiz Topic Prompt
  adaptiveQuiz: (topic, difficulty, studentContext) => ({
    system: `You are an expert educational assessment designer creating adaptive quizzes.
Generate questions that:
- Match the ${difficulty} difficulty level precisely
- Focus specifically on the given topic
- Test different aspects of understanding
- Are appropriate for the student's current level

Return ONLY a valid JSON array:
[{
  "question": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "difficulty": "${difficulty}"
}]`,
    user: `Generate 5 ${difficulty} difficulty quiz questions on the topic: "${topic}"

${studentContext ? `Student Context: ${studentContext}` : ''}

Return ONLY the JSON array, no markdown or explanations.`
  })
};

// ============================================
// AI SERVICE CONFIGURATION
// ============================================
const AI_CONFIG = {
  apiUrl: 'https://api.aimlapi.com/chat/completions',
  model: 'gpt-4o-mini', // Using gpt-4o-mini for better cost efficiency
  defaultTemperature: 0.7,
  maxRetries: 2,
  timeout: 30000, // 30 seconds
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make API call to AIML with retry logic and error handling
 */
async function callAIML(prompt, options = {}) {
  const { temperature = AI_CONFIG.defaultTemperature, maxTokens = 2000 } = options;
  
  if (!process.env.AIML_API_KEY) {
    throw new Error('AIML_API_KEY is not configured');
  }

  let lastError;
  for (let attempt = 0; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

      const response = await fetch(AI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AIML API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.warn(`AIML API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < AI_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Parse and validate JSON response from AI
 */
function parseAIJsonResponse(content, fallback = []) {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse AI JSON response:', error.message);
    console.error('Raw content:', content);
    return fallback;
  }
}

/**
 * Normalize quiz questions to database format
 */
function normalizeQuestions(questions, defaultDifficulty = 'medium') {
  return questions.map((q, index) => ({
    question: q.question || q.text || '',
    options: Array.isArray(q.options) ? q.options : [],
    correct_answer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 
                    typeof q.correct_answer === 'number' ? q.correct_answer :
                    typeof q.answer === 'number' ? q.answer : 0,
    difficulty: q.difficulty || defaultDifficulty,
    order_num: index + 1,
  }));
}

/**
 * Validate material content for AI processing
 */
function validateMaterialContent(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'No content provided' };
  }
  
  const trimmed = content.trim();
  if (trimmed.length < 50) {
    return { valid: false, error: 'Content too short (minimum 50 characters)' };
  }
  
  if (trimmed.length > 50000) {
    return { valid: false, error: 'Content too long (maximum 50000 characters)', truncated: trimmed.slice(0, 50000) };
  }
  
  return { valid: true, content: trimmed };
}

// ============================================
// AI SERVICE CLASS
// ============================================
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

      // Get and validate material content
      const materialContent = material.ai_summary || material.description || material.title || '';
      const validation = validateMaterialContent(materialContent);
      
      if (!validation.valid && !validation.truncated) {
        throw new Error(`Invalid material content: ${validation.error}`);
      }

      const contentToUse = validation.truncated || validation.content;

      // Generate questions using AI
      const prompt = PROMPTS.quizGeneration(contentToUse, numQuestions, difficulty);
      const aiContent = await callAIML(prompt, { maxTokens: 3000 });
      const parsedQuestions = parseAIJsonResponse(aiContent, []);

      if (parsedQuestions.length === 0) {
        throw new Error('AI failed to generate valid questions');
      }

      // Normalize questions to database format
      const normalizedQuestions = normalizeQuestions(parsedQuestions, difficulty);

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          class_id: classId,
          created_by: teacherId,
          title: `AI Generated: ${material.title}`,
          description: `Automatically generated from material: ${material.title}`,
          published: false,
        })
        .select()
        .single();

      if (quizError) throw new Error(`Quiz creation error: ${quizError.message}`);

      // Add questions to quiz
      const questions = [];
      for (const q of normalizedQuestions) {
        const { data: question, error: qError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            order_num: q.order_num,
          })
          .select()
          .single();

        if (qError) {
          console.error(`Question creation error:`, qError);
          continue; // Skip failed questions but continue
        }
        questions.push(question);
      }

      if (questions.length === 0) {
        // Rollback quiz if no questions were added
        await supabase.from('quizzes').delete().eq('id', quiz.id);
        throw new Error('Failed to add any questions to the quiz');
      }

      return {
        ...quiz,
        questions,
        generated: true,
        questionsRequested: numQuestions,
        questionsGenerated: questions.length,
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

      const materialContent = material.description || material.title || '';
      const validation = validateMaterialContent(materialContent);

      if (!validation.valid && !validation.truncated) {
        // Return a simple summary if content is too short
        return {
          materialId,
          summary: `This material covers: ${material.title}`,
          material,
          generated: false,
          reason: validation.error,
        };
      }

      const contentToUse = validation.truncated || validation.content;
      const prompt = PROMPTS.materialSummary(contentToUse);
      const summary = await callAIML(prompt, { maxTokens: 500 });

      // Store summary in database
      const { data: updated, error: updateError } = await supabase
        .from('materials')
        .update({
          ai_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', materialId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to store summary:', updateError);
      }

      return {
        materialId,
        summary,
        material: updated || material,
        generated: true,
      };
    } catch (error) {
      console.error('Summarize material error:', error);
      
      // Fallback: return basic summary
      return {
        materialId,
        summary: 'Unable to generate AI summary at this time. Please try again later.',
        generated: false,
        error: error.message,
      };
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

      if (quizzes.length === 0) {
        return {
          classId,
          metrics: {
            totalQuizzes: 0,
            totalAttempts: 0,
            averageScore: 0,
            lowPerformanceRate: 0,
            highPerformanceRate: 0,
          },
          aiInsights: 'No quizzes have been created yet. Create quizzes and have students take them to get AI-powered insights.',
          generated: false,
        };
      }

      // Get attempts for all quizzes
      const quizIds = quizzes.map(q => q.id);
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('quiz_id', quizIds);

      if (aError) throw new Error(`Attempt query error: ${aError.message}`);

      if (attempts.length === 0) {
        return {
          classId,
          metrics: {
            totalQuizzes: quizzes.length,
            totalAttempts: 0,
            averageScore: 0,
            lowPerformanceRate: 0,
            highPerformanceRate: 0,
          },
          aiInsights: 'No quiz attempts recorded yet. Insights will be available once students start taking quizzes.',
          generated: false,
        };
      }

      // Calculate metrics
      const scores = attempts.map(a => a.percentage || a.score || 0);
      const avgScore = (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1);
      const lowPerformance = scores.filter(s => s < 60).length;
      const highPerformance = scores.filter(s => s >= 80).length;
      const lowPerformanceRate = ((lowPerformance / scores.length) * 100).toFixed(1);
      const highPerformanceRate = ((highPerformance / scores.length) * 100).toFixed(1);

      // Get question-level analysis if available
      let questionAnalysis = '';
      try {
        const { data: answers } = await supabase
          .from('attempt_answers')
          .select('question_id, correct')
          .in('attempt_id', attempts.map(a => a.id));
        
        if (answers && answers.length > 0) {
          const questionStats = {};
          answers.forEach(a => {
            if (!questionStats[a.question_id]) {
              questionStats[a.question_id] = { correct: 0, total: 0 };
            }
            questionStats[a.question_id].total++;
            if (a.correct) questionStats[a.question_id].correct++;
          });
          
          const hardestQuestions = Object.entries(questionStats)
            .map(([id, stats]) => ({ id, rate: (stats.correct / stats.total * 100).toFixed(0) }))
            .sort((a, b) => a.rate - b.rate)
            .slice(0, 3);
          
          if (hardestQuestions.length > 0) {
            questionAnalysis = `Most challenging questions have ${hardestQuestions[0].rate}% - ${hardestQuestions[hardestQuestions.length - 1].rate}% correct rates.`;
          }
        }
      } catch (e) {
        console.warn('Could not analyze question-level data:', e.message);
      }

      // Generate AI insights
      const promptData = {
        totalQuizzes: quizzes.length,
        totalAttempts: attempts.length,
        averageScore: avgScore,
        lowPerformanceRate,
        highPerformanceRate,
        questionAnalysis,
      };

      const prompt = PROMPTS.teacherInsights(promptData);
      const insights = await callAIML(prompt, { maxTokens: 600 });

      // Store insights in database
      try {
        await supabase.from('ai_insights').insert({
          class_id: classId,
          insight_type: 'teacher',
          summary: insights,
          generated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to store insights:', e.message);
      }

      return {
        classId,
        metrics: {
          totalQuizzes: quizzes.length,
          totalAttempts: attempts.length,
          averageScore: parseFloat(avgScore),
          lowPerformanceRate: parseFloat(lowPerformanceRate),
          highPerformanceRate: parseFloat(highPerformanceRate),
        },
        aiInsights: insights,
        generated: true,
      };
    } catch (error) {
      console.error('Get insights error:', error);
      
      // Fallback response
      return {
        classId,
        metrics: {
          totalQuizzes: 0,
          totalAttempts: 0,
          averageScore: 0,
          lowPerformanceRate: 0,
          highPerformanceRate: 0,
        },
        aiInsights: 'Unable to generate insights at this time. Please try again later.',
        generated: false,
        error: error.message,
      };
    }
  }

  /**
   * Get personalized recommendations for student
   */
  static async getStudentRecommendations(classId, studentId) {
    try {
      // Get quizzes for this class
      const { data: quizzes, error: qError } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('class_id', classId);

      if (qError) throw new Error(`Quiz query error: ${qError.message}`);

      if (quizzes.length === 0) {
        return {
          studentId,
          classId,
          performanceMetrics: { attemptCount: 0, averageScore: 0 },
          recommendations: 'No quizzes available in this class yet. Recommendations will appear once you start taking quizzes.',
          generated: false,
        };
      }

      // Get student's attempts in class
      const quizIds = quizzes.map(q => q.id);
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('quiz_id', quizIds);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      if (attempts.length === 0) {
        return {
          studentId,
          classId,
          performanceMetrics: { attemptCount: 0, averageScore: 0 },
          recommendations: 'Start taking quizzes to receive personalized learning recommendations based on your performance.',
          generated: false,
        };
      }

      // Analyze performance
      const scores = attempts.map(a => a.percentage || a.score || 0);
      const avgScore = (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1);
      const bestScore = Math.max(...scores).toFixed(0);
      const worstScore = Math.min(...scores).toFixed(0);

      // Determine strengths and weaknesses
      let strengths = '';
      let weaknesses = '';
      
      if (parseFloat(avgScore) >= 80) {
        strengths = 'Consistent high performance across quizzes';
      } else if (parseFloat(avgScore) >= 60) {
        strengths = 'Good foundational understanding';
        weaknesses = 'Some areas need reinforcement';
      } else {
        weaknesses = 'Needs additional practice and review';
      }

      // Generate AI recommendations
      const promptData = {
        attemptCount: attempts.length,
        averageScore: avgScore,
        bestScore,
        worstScore,
        strengths,
        weaknesses,
      };

      const prompt = PROMPTS.studentRecommendation(promptData);
      const recommendations = await callAIML(prompt, { maxTokens: 500 });

      // Store recommendations
      try {
        await supabase.from('ai_insights').insert({
          class_id: classId,
          user_id: studentId,
          insight_type: 'student',
          summary: recommendations,
          generated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to store recommendations:', e.message);
      }

      return {
        studentId,
        classId,
        performanceMetrics: {
          attemptCount: attempts.length,
          averageScore: parseFloat(avgScore),
          bestScore: parseFloat(bestScore),
          worstScore: parseFloat(worstScore),
        },
        recommendations,
        generated: true,
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      
      return {
        studentId,
        classId,
        performanceMetrics: { attemptCount: 0, averageScore: 0 },
        recommendations: 'Unable to generate recommendations at this time. Please try again later.',
        generated: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate adaptive quiz based on student performance
   */
  static async generateAdaptiveQuiz(classId, studentId, topicId) {
    try {
      // Get the class to find the teacher
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('teacher_id, name')
        .eq('id', classId)
        .single();

      if (classError) throw new Error(`Class query error: ${classError.message}`);

      // Get student's recent performance
      const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .single();

      // Determine difficulty based on performance
      let difficulty = 'medium';
      let studentContext = '';
      
      if (progress && progress.average_score !== null) {
        if (progress.average_score >= 80) {
          difficulty = 'hard';
          studentContext = 'Student is performing well and ready for more challenging questions.';
        } else if (progress.average_score < 60) {
          difficulty = 'easy';
          studentContext = 'Student needs more practice with fundamental concepts.';
        } else {
          studentContext = 'Student has moderate understanding and should be challenged appropriately.';
        }
      }

      // Generate questions with AI
      const prompt = PROMPTS.adaptiveQuiz(topicId, difficulty, studentContext);
      const aiContent = await callAIML(prompt, { maxTokens: 1500 });
      const parsedQuestions = parseAIJsonResponse(aiContent, []);

      if (parsedQuestions.length === 0) {
        throw new Error('AI failed to generate valid questions');
      }

      // Normalize questions
      const normalizedQuestions = normalizeQuestions(parsedQuestions, difficulty);

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          class_id: classId,
          created_by: classData.teacher_id,
          title: `Adaptive Quiz: ${topicId}`,
          description: `Personalized ${difficulty} difficulty quiz on "${topicId}"`,
          published: true, // Adaptive quizzes are immediately available
        })
        .select()
        .single();

      if (quizError) throw new Error(`Quiz creation error: ${quizError.message}`);

      // Add questions to quiz
      const questions = [];
      for (const q of normalizedQuestions) {
        const { data: question, error: qError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            order_num: q.order_num,
          })
          .select()
          .single();

        if (qError) {
          console.error('Question error:', qError);
          continue;
        }
        questions.push(question);
      }

      return {
        quiz,
        questions,
        adaptiveDifficulty: difficulty,
        studentPerformance: progress?.average_score || null,
        topic: topicId,
        generated: true,
      };
    } catch (error) {
      console.error('Generate adaptive quiz error:', error);
      throw error;
    }
  }

  /**
   * Generate quiz from raw text content (no material required)
   */
  static async generateQuizFromText(classId, teacherId, content, options = {}) {
    try {
      const { title = 'Custom Quiz', numQuestions = 10, difficulty = 'medium' } = options;

      const validation = validateMaterialContent(content);
      if (!validation.valid && !validation.truncated) {
        throw new Error(`Invalid content: ${validation.error}`);
      }

      const contentToUse = validation.truncated || validation.content;

      // Generate questions using AI
      const prompt = PROMPTS.quizGeneration(contentToUse, numQuestions, difficulty);
      const aiContent = await callAIML(prompt, { maxTokens: 3000 });
      const parsedQuestions = parseAIJsonResponse(aiContent, []);

      if (parsedQuestions.length === 0) {
        throw new Error('AI failed to generate valid questions');
      }

      const normalizedQuestions = normalizeQuestions(parsedQuestions, difficulty);

      // Create quiz in database
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          class_id: classId,
          created_by: teacherId,
          title: `AI Generated: ${title}`,
          description: `Automatically generated quiz`,
          published: false,
        })
        .select()
        .single();

      if (quizError) throw new Error(`Quiz creation error: ${quizError.message}`);

      // Add questions
      const questions = [];
      for (const q of normalizedQuestions) {
        const { data: question, error: qError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            order_num: q.order_num,
          })
          .select()
          .single();

        if (!qError) questions.push(question);
      }

      return {
        ...quiz,
        questions,
        generated: true,
        questionsRequested: numQuestions,
        questionsGenerated: questions.length,
      };
    } catch (error) {
      console.error('Generate quiz from text error:', error);
      throw error;
    }
  }

  /**
   * Analyze quiz difficulty and provide recommendations
   */
  static async analyzeQuizDifficulty(quizId) {
    try {
      // Get quiz attempts
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      if (attempts.length < 3) {
        return {
          quizId,
          analysis: 'Need at least 3 attempts to analyze quiz difficulty.',
          generated: false,
        };
      }

      // Get question-level data
      const { data: answers, error: ansError } = await supabase
        .from('attempt_answers')
        .select(`
          question_id,
          correct,
          quiz_questions!inner(question, difficulty)
        `)
        .in('attempt_id', attempts.map(a => a.id));

      if (ansError) throw new Error(`Answers query error: ${ansError.message}`);

      // Calculate per-question stats
      const questionStats = {};
      answers.forEach(a => {
        const qId = a.question_id;
        if (!questionStats[qId]) {
          questionStats[qId] = {
            correct: 0,
            total: 0,
            question: a.quiz_questions?.question,
            difficulty: a.quiz_questions?.difficulty,
          };
        }
        questionStats[qId].total++;
        if (a.correct) questionStats[qId].correct++;
      });

      // Identify problematic questions
      const hardQuestions = [];
      const easyQuestions = [];

      Object.entries(questionStats).forEach(([id, stats]) => {
        const correctRate = (stats.correct / stats.total) * 100;
        if (correctRate < 40) {
          hardQuestions.push({ id, correctRate: correctRate.toFixed(0), question: stats.question });
        } else if (correctRate > 90) {
          easyQuestions.push({ id, correctRate: correctRate.toFixed(0), question: stats.question });
        }
      });

      return {
        quizId,
        totalAttempts: attempts.length,
        averageScore: (attempts.reduce((sum, a) => sum + (a.percentage || a.score || 0), 0) / attempts.length).toFixed(1),
        hardQuestions,
        easyQuestions,
        recommendations: hardQuestions.length > 0 
          ? 'Consider providing additional materials for the challenging questions or adjusting their difficulty.'
          : 'Quiz difficulty appears balanced.',
        generated: true,
      };
    } catch (error) {
      console.error('Analyze quiz difficulty error:', error);
      throw error;
    }
  }
}

export default AIService;

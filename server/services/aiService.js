import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy-initialize OpenAI client to allow server to start without API key
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.AIML_API_KEY || 'dummy-key-for-initialization';
    openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.aimlapi.com/v1', // AI/ML API endpoint
    });
  }
  return openai;
};

/**
 * Generate insights from grade data using AI/ML API
 * @param {Array} gradeData - Array of grade objects
 * @returns {Promise<string>} - AI-generated insights
 */
export const generateInsights = async (gradeData) => {
  // Check if API key is configured
  if (!process.env.AIML_API_KEY || process.env.AIML_API_KEY === 'your_aiml_api_key_here') {
    throw new Error('AI/ML API key not configured. Please add AIML_API_KEY to your .env file. Get your free key at https://aimlapi.com/');
  }

  try {
    const gradeJson = JSON.stringify(gradeData, null, 2);
    
    const prompt = `Analyze the following student grade data. Provide 2-3 clear insights and teacher recommendations.

Data: ${gradeJson}

Please provide:
1. Key patterns or trends in the data
2. Students who may need additional support
3. Actionable recommendations for the teacher

Keep the response concise and practical.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-3.5-turbo", "claude-3-5-sonnet", etc.
      messages: [
        {
          role: "system",
          content: "You are an educational data analyst helping teachers understand student performance and provide actionable recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate AI insights');
  }
};

/**
 * Generate personalized learning recommendations based on quiz performance
 * @param {Object} quizData - Quiz result data
 * @returns {Promise<Array<string>>} - Array of recommendations
 */
export const generateRecommendations = async (quizData) => {
  // Check if API key is configured
  if (!process.env.AIML_API_KEY || process.env.AIML_API_KEY === 'your_aiml_api_key_here') {
    console.warn('AI/ML API key not configured. Returning fallback recommendations.');
    return [
      'Review the questions you got wrong and understand why',
      'Practice similar problems to reinforce your learning',
      'Consider additional study materials or tutoring for challenging topics'
    ];
  }

  try {
    const scoreJson = JSON.stringify(quizData, null, 2);
    
    const prompt = `Based on this quiz score, provide 3 actionable learning recommendations.

Data: ${scoreJson}

Provide specific, practical recommendations that will help the student improve their understanding. Focus on:
1. Areas where the student struggled
2. Study strategies that would be most effective
3. Next steps for continued learning

Return exactly 3 recommendations, each as a separate, actionable point.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an educational advisor providing personalized learning recommendations based on student quiz performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });
    
    const text = completion.choices[0].message.content;
    
    // Parse the response into an array of recommendations
    const recommendations = text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3); // Ensure we only return 3 recommendations
    
    return recommendations.length > 0 ? recommendations : [
      'Review the questions you got wrong and understand why',
      'Practice similar problems to reinforce your learning',
      'Consider additional study materials or tutoring for challenging topics'
    ];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Return fallback recommendations
    return [
      'Review the questions you got wrong and understand why',
      'Practice similar problems to reinforce your learning',
      'Consider additional study materials or tutoring for challenging topics'
    ];
  }
};

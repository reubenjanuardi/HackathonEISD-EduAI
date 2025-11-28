import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Generate insights from grade data using Gemini AI
 * @param {Array} gradeData - Array of grade objects
 * @returns {Promise<string>} - AI-generated insights
 */
export const generateInsights = async (gradeData) => {
  try {
    const gradeJson = JSON.stringify(gradeData, null, 2);
    
    const prompt = `Analyze the following student grade data. Provide 2-3 clear insights and teacher recommendations.

Data: ${gradeJson}

Please provide:
1. Key patterns or trends in the data
2. Students who may need additional support
3. Actionable recommendations for the teacher

Keep the response concise and practical.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
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
  try {
    const scoreJson = JSON.stringify(quizData, null, 2);
    
    const prompt = `Based on this quiz score, provide 3 actionable learning recommendations.

Data: ${scoreJson}

Provide specific, practical recommendations that will help the student improve their understanding. Focus on:
1. Areas where the student struggled
2. Study strategies that would be most effective
3. Next steps for continued learning

Return exactly 3 recommendations, each as a separate, actionable point.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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

// Question bank with different difficulty levels
const questionBank = [
  // Easy Questions
  {
    id: 'q1',
    question: 'What is 5 + 7?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    difficulty: 'easy',
    subject: 'Math',
  },
  {
    id: 'q2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    difficulty: 'easy',
    subject: 'Science',
  },
  {
    id: 'q3',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    difficulty: 'easy',
    subject: 'Geography',
  },
  {
    id: 'q4',
    question: 'How many sides does a triangle have?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
    difficulty: 'easy',
    subject: 'Math',
  },
  
  // Medium Questions
  {
    id: 'q5',
    question: 'What is the square root of 144?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    difficulty: 'medium',
    subject: 'Math',
  },
  {
    id: 'q6',
    question: 'Which element has the chemical symbol "Au"?',
    options: ['Silver', 'Gold', 'Aluminum', 'Argon'],
    correctAnswer: 1,
    difficulty: 'medium',
    subject: 'Science',
  },
  {
    id: 'q7',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2,
    difficulty: 'medium',
    subject: 'History',
  },
  {
    id: 'q8',
    question: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctAnswer: 1,
    difficulty: 'medium',
    subject: 'Math',
  },
  
  // Hard Questions
  {
    id: 'q9',
    question: 'What is the derivative of x² + 3x?',
    options: ['2x + 3', 'x + 3', '2x', 'x² + 3'],
    correctAnswer: 0,
    difficulty: 'hard',
    subject: 'Math',
  },
  {
    id: 'q10',
    question: 'Which scientist proposed the theory of general relativity?',
    options: ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Niels Bohr'],
    correctAnswer: 1,
    difficulty: 'hard',
    subject: 'Science',
  },
  {
    id: 'q11',
    question: 'What is the atomic number of Carbon?',
    options: ['4', '6', '8', '12'],
    correctAnswer: 1,
    difficulty: 'hard',
    subject: 'Science',
  },
  {
    id: 'q12',
    question: 'Solve for x: 3x + 7 = 22',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    difficulty: 'hard',
    subject: 'Math',
  },
];

/**
 * Get a random question by difficulty
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {Array} excludeIds - Array of question IDs to exclude
 * @returns {Object} - Random question
 */
export const getQuestionByDifficulty = (difficulty, excludeIds = []) => {
  const availableQuestions = questionBank.filter(
    q => q.difficulty === difficulty && !excludeIds.includes(q.id)
  );
  
  if (availableQuestions.length === 0) {
    // Fallback to any difficulty if none available
    const fallbackQuestions = questionBank.filter(q => !excludeIds.includes(q.id));
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

/**
 * Determine next difficulty based on performance
 * @param {boolean} wasCorrect - Was the last answer correct
 * @param {string} currentDifficulty - Current difficulty level
 * @returns {string} - Next difficulty level
 */
export const getNextDifficulty = (wasCorrect, currentDifficulty) => {
  const difficultyLevels = ['easy', 'medium', 'hard'];
  const currentIndex = difficultyLevels.indexOf(currentDifficulty);
  
  if (wasCorrect && currentIndex < 2) {
    // Increase difficulty if answer was correct
    return difficultyLevels[currentIndex + 1];
  } else if (!wasCorrect && currentIndex > 0) {
    // Decrease difficulty if answer was wrong
    return difficultyLevels[currentIndex - 1];
  }
  
  return currentDifficulty;
};

/**
 * Calculate quiz score
 * @param {Array} answers - Array of answer objects
 * @returns {Object} - Score information
 */
export const calculateScore = (answers) => {
  const correctAnswers = answers.filter(a => a.correct).length;
  const totalQuestions = answers.length;
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  return {
    score: correctAnswers,
    totalQuestions,
    percentage: percentage.toFixed(2),
  };
};

export default {
  questionBank,
  getQuestionByDifficulty,
  getNextDifficulty,
  calculateScore,
};

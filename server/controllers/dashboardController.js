import Grade from '../models/Grade.js';
import QuizResult from '../models/QuizResult.js';

/**
 * Get dashboard statistics and data
 */
export const getDashboard = async (req, res) => {
  try {
    // Get all grades
    const allGrades = await Grade.find().sort({ createdAt: -1 }).limit(100);
    
    // Calculate statistics
    const totalStudents = new Set(allGrades.map(g => g.studentName)).size;
    const averageGrade = allGrades.length > 0
      ? (allGrades.reduce((sum, g) => sum + g.grade, 0) / allGrades.length).toFixed(2)
      : 0;
    
    // Get quiz completion rate
    const totalQuizzes = await QuizResult.countDocuments();
    const completedQuizzes = await QuizResult.countDocuments({ completed: true });
    const quizCompletion = totalQuizzes > 0
      ? ((completedQuizzes / totalQuizzes) * 100).toFixed(0)
      : 0;
    
    // Grade distribution for chart
    const gradeDistribution = [
      { grade: 'A (90-100)', count: allGrades.filter(g => g.grade >= 90).length },
      { grade: 'B (80-89)', count: allGrades.filter(g => g.grade >= 80 && g.grade < 90).length },
      { grade: 'C (70-79)', count: allGrades.filter(g => g.grade >= 70 && g.grade < 80).length },
      { grade: 'D (60-69)', count: allGrades.filter(g => g.grade >= 60 && g.grade < 70).length },
      { grade: 'F (<60)', count: allGrades.filter(g => g.grade < 60).length },
    ];
    
    // Subject performance for pie chart
    const subjectMap = {};
    allGrades.forEach(g => {
      if (!subjectMap[g.subject]) {
        subjectMap[g.subject] = { sum: 0, count: 0 };
      }
      subjectMap[g.subject].sum += g.grade;
      subjectMap[g.subject].count += 1;
    });
    
    const subjectPerformance = Object.keys(subjectMap).map(subject => ({
      name: subject,
      value: Math.round(subjectMap[subject].sum / subjectMap[subject].count),
    }));
    
    // Recent students
    const recentStudents = allGrades.slice(0, 10).map(g => ({
      name: g.studentName,
      subject: g.subject,
      grade: g.grade,
      date: new Date(g.date).toLocaleDateString(),
    }));
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        averageGrade: parseFloat(averageGrade),
        quizCompletion: parseInt(quizCompletion),
      },
      gradeDistribution,
      subjectPerformance,
      recentStudents,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
    });
  }
};

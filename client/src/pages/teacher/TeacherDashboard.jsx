import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Navbar from '../../components/Navbar';
import { useAuthStore, useClassStore } from '../../stores';
import { getClassAnalytics } from '../../services/api';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  const { classes, fetchClasses, loading } = useClassStore();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    averageScore: 0,
    atRiskCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    // Aggregate stats from all classes
    const loadStats = async () => {
      let totalStudents = 0;
      let totalQuizzes = 0;
      let totalScore = 0;
      let scoreCount = 0;
      let atRiskCount = 0;

      for (const cls of classes) {
        try {
          const analytics = await getClassAnalytics(cls.id);
          totalStudents += analytics.enrolledStudents || 0;
          totalQuizzes += analytics.totalQuizzes || 0;
          if (analytics.averageScore) {
            totalScore += analytics.averageScore;
            scoreCount++;
          }
          atRiskCount += analytics.atRiskStudents?.length || 0;
        } catch (err) {
          console.error('Error fetching analytics for class:', cls.id, err);
        }
      }

      setStats({
        totalStudents,
        totalQuizzes,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        atRiskCount
      });
    };

    if (classes.length > 0) {
      loadStats();
    }
  }, [classes]);

  const statCards = [
    {
      title: 'Total Classes',
      value: classes.length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Active Quizzes',
      value: stats.totalQuizzes,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'At-Risk Students',
      value: stats.atRiskCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {profile?.name || 'Teacher'}! 👋
              </h1>
              <p className="text-neutral-400">Here's what's happening with your classes</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link to="/teacher/classes">
                <Button variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Class
                </Button>
              </Link>
            </div>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-neutral-400 text-sm">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your Classes</h2>
            <Link to="/teacher/classes" className="text-primary hover:text-primary/80 text-sm">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : classes.length === 0 ? (
            <Card className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No classes yet</h3>
              <p className="text-neutral-400 mb-4">Create your first class to get started</p>
              <Link to="/teacher/classes">
                <Button variant="primary">Create Class</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.slice(0, 6).map((cls) => (
                <Link 
                  key={cls.id} 
                  to={`/teacher/classes/${cls.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: cls.color || '#6366f1' }}
                      >
                        {cls.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-neutral-700 text-neutral-300">
                        {cls.subject}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{cls.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                      {cls.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        Code: <span className="text-primary font-mono">{cls.enrollment_code}</span>
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/teacher/classes">
              <Card className="hover:border-primary/50 transition-all duration-200 text-center py-6">
                <svg className="w-8 h-8 mx-auto text-primary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-white font-medium">New Class</h3>
                <p className="text-neutral-400 text-sm">Create a new class</p>
              </Card>
            </Link>

            {classes.length > 0 && (
              <>
                <Link to={`/teacher/materials/${classes[0].id}`}>
                  <Card className="hover:border-primary/50 transition-all duration-200 text-center py-6">
                    <svg className="w-8 h-8 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <h3 className="text-white font-medium">Upload Material</h3>
                    <p className="text-neutral-400 text-sm">Add course content</p>
                  </Card>
                </Link>

                <Link to={`/teacher/quiz-builder/${classes[0].id}`}>
                  <Card className="hover:border-primary/50 transition-all duration-200 text-center py-6">
                    <svg className="w-8 h-8 mx-auto text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-white font-medium">Create Quiz</h3>
                    <p className="text-neutral-400 text-sm">AI-powered quiz builder</p>
                  </Card>
                </Link>

                <Link to={`/teacher/analytics/${classes[0].id}`}>
                  <Card className="hover:border-primary/50 transition-all duration-200 text-center py-6">
                    <svg className="w-8 h-8 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-white font-medium">View Analytics</h3>
                    <p className="text-neutral-400 text-sm">Student performance</p>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Chart from '../../components/Chart';
import Navbar from '../../components/Navbar';
import { useAuthStore, useClassStore } from '../../stores';
import { getStudentProgress, getAIRecommendations } from '../../services/api';

const StudentProgress = () => {
  const { profile } = useAuthStore();
  const { classes } = useClassStore();
  const [progress, setProgress] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await getStudentProgress();
      setProgress(data);
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (classId) => {
    if (!classId) return;
    setRecommendationsLoading(true);
    try {
      const data = await getAIRecommendations(classId);
      setRecommendations(data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const performanceData = progress?.performanceTrend || [];
  const subjectPerformance = progress?.subjectPerformance || [];
  const recentResults = progress?.recentResults || [];
  const achievements = progress?.achievements || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Progress</h1>
            <p className="text-neutral-400">Track your learning journey and achievements</p>
          </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {progress?.completedQuizzes || 0}
            </div>
            <div className="text-neutral-400">Quizzes Completed</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">
              {progress?.averageScore?.toFixed(1) || 0}%
            </div>
            <div className="text-neutral-400">Average Score</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {progress?.totalPoints || 0}
            </div>
            <div className="text-neutral-400">Total Points</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {progress?.streak || 0}
            </div>
            <div className="text-neutral-400">Day Streak</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
              {performanceData.length > 0 ? (
                <Chart 
                  type="line"
                  data={performanceData}
                  dataKey="score"
                  xAxisKey="date"
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-500">
                  Complete quizzes to see your performance trend
                </div>
              )}
            </Card>

            {/* Subject Performance */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Performance by Subject</h3>
              {subjectPerformance.length > 0 ? (
                <div className="space-y-4">
                  {subjectPerformance.map((subject, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-300">{subject.name}</span>
                        <span className="text-white font-medium">{subject.score}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            subject.score >= 70 ? 'bg-green-500' :
                            subject.score >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${subject.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No subject data available
                </div>
              )}
            </Card>

            {/* Recent Quiz Results */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Quiz Results</h3>
              {recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">{result.quizTitle}</h4>
                        <p className="text-neutral-500 text-sm">
                          {result.className} • {new Date(result.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${
                          result.score >= 70 ? 'text-green-400' :
                          result.score >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.score}%
                        </span>
                        <p className="text-neutral-500 text-sm">
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No quiz results yet. Take a quiz to see your results here!
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold mb-3">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <h3 className="text-lg font-semibold text-white">{profile?.name}</h3>
                <p className="text-neutral-400 text-sm">{profile?.email}</p>
              </div>
              <div className="pt-4 border-t border-neutral-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-400">Member since</span>
                  <span className="text-white">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Classes enrolled</span>
                  <span className="text-white">{progress?.enrolledClasses || 0}</span>
                </div>
              </div>
            </Card>

            {/* Achievements */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
              {achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-700/50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h4 className="text-white font-medium">{achievement.title}</h4>
                        <p className="text-neutral-500 text-sm">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-4xl mb-2 block">🏆</span>
                  <p className="text-neutral-500 text-sm">
                    Complete quizzes to unlock achievements!
                  </p>
                </div>
              )}
            </Card>

            {/* Quick Links */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link 
                  to="/student/classes"
                  className="block p-3 bg-neutral-700/50 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  📚 Browse Classes
                </Link>
                <Link 
                  to="/student/dashboard"
                  className="block p-3 bg-neutral-700/50 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  🏠 Dashboard
                </Link>
              </div>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
              </div>
              
              {classes && classes.length > 0 ? (
                <div className="space-y-3">
                  <select
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setRecommendations(null);
                    }}
                  >
                    <option value="">Select a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id || cls.classes?.id} value={cls.id || cls.classes?.id}>
                        {cls.name || cls.classes?.name}
                      </option>
                    ))}
                  </select>

                  {selectedClassId && !recommendations && (
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      onClick={() => loadRecommendations(selectedClassId)}
                      loading={recommendationsLoading}
                    >
                      Get AI Recommendations
                    </Button>
                  )}

                  {recommendationsLoading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-neutral-400 text-sm mt-2">Analyzing...</p>
                    </div>
                  )}

                  {recommendations && recommendations.data && (
                    <div className="space-y-3">
                      {recommendations.data.performanceMetrics && (
                        <div className="p-3 bg-neutral-800/50 rounded-lg">
                          <div className="text-sm text-neutral-400 mb-1">Your Average Score</div>
                          <div className={`text-xl font-bold ${
                            recommendations.data.performanceMetrics.averageScore >= 70 ? 'text-green-400' :
                            recommendations.data.performanceMetrics.averageScore >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {recommendations.data.performanceMetrics.averageScore || 0}%
                          </div>
                          {recommendations.data.performanceMetrics.attemptCount > 0 && (
                            <div className="text-xs text-neutral-500 mt-1">
                              Based on {recommendations.data.performanceMetrics.attemptCount} quiz attempt(s)
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {recommendations.data.recommendations || 'Take some quizzes to get personalized recommendations!'}
                        </div>
                      </div>

                      <Button 
                        variant="secondary" 
                        className="w-full text-sm" 
                        onClick={() => loadRecommendations(selectedClassId)}
                      >
                        🔄 Refresh Recommendations
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">
                  Enroll in classes to get personalized AI recommendations.
                </p>
              )}
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;

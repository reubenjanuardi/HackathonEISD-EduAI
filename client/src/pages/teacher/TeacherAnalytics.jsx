import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Chart from '../../components/Chart';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore } from '../../stores';
import { getClassAnalytics, getQuizAnalytics, getAtRiskStudents, exportData, getAIInsights } from '../../services/api';

const TeacherAnalytics = () => {
  const { classId } = useParams();
  const { currentClass, fetchClassDetail } = useClassStore();
  const { addToast } = useToast();
  
  const [analytics, setAnalytics] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [quizAnalytics, setQuizAnalytics] = useState([]);
  const [aiInsights, setAIInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (classId) {
      fetchClassDetail(classId);
      loadAnalytics();
    }
  }, [classId, fetchClassDetail]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [classData, atRiskData] = await Promise.all([
        getClassAnalytics(classId),
        getAtRiskStudents(classId)
      ]);
      setAnalytics(classData);
      setAtRiskStudents(atRiskData);

      // Load quiz-specific analytics if there are quizzes
      if (classData.quizzes && classData.quizzes.length > 0) {
        const quizPromises = classData.quizzes.slice(0, 5).map(q => 
          getQuizAnalytics(q.id).catch(() => null)
        );
        const quizResults = await Promise.all(quizPromises);
        setQuizAnalytics(quizResults.filter(Boolean));
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportData(classId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentClass?.name || 'class'}-analytics.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'ai-insights', label: '🤖 AI Insights' }
  ];

  const loadAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const data = await getAIInsights(classId);
      setAIInsights(data);
    } catch (err) {
      console.error('Error loading AI insights:', err);
      addToast('Failed to load AI insights', 'error');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo={`/teacher/classes/${classId}`} backLabel="Back to Class" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const performanceData = analytics?.performanceTrend || [];
  const gradeDistribution = analytics?.gradeDistribution || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar 
        showBack 
        backTo={`/teacher/classes/${classId}`} 
        backLabel="Back to Class" 
      />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-neutral-400">{currentClass?.name || 'Loading...'}</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
              >
                Export Excel
              </button>
            </div>
          </div>

        {/* Tabs */}
        <div className="border-b border-neutral-700 mb-6">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-primary' 
                    : 'text-neutral-400 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {analytics?.enrolledStudents || 0}
                </div>
                <div className="text-neutral-400">Enrolled Students</div>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {analytics?.averageScore?.toFixed(1) || 0}%
                </div>
                <div className="text-neutral-400">Average Score</div>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {analytics?.completionRate?.toFixed(1) || 0}%
                </div>
                <div className="text-neutral-400">Completion Rate</div>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">
                  {atRiskStudents.length}
                </div>
                <div className="text-neutral-400">At-Risk Students</div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
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
                    No performance data available
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Grade Distribution</h3>
                {gradeDistribution.length > 0 ? (
                  <Chart 
                    type="bar"
                    data={gradeDistribution}
                    dataKey="count"
                    xAxisKey="grade"
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-neutral-500">
                    No grade data available
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* At-Risk Alert */}
            {atRiskStudents.length > 0 && (
              <Card className="border-red-500/50 bg-red-500/10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">At-Risk Students</h3>
                    <p className="text-neutral-400 mb-4">
                      These students may need additional support based on their performance.
                    </p>
                    <div className="space-y-2">
                      {atRiskStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                          <div>
                            <span className="text-white font-medium">{student.name}</span>
                            <span className="text-neutral-500 text-sm ml-2">{student.email}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-red-400 font-medium">{student.averageScore?.toFixed(1)}%</span>
                            <span className="text-neutral-500 text-sm ml-2">avg score</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Student Performance List */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Student Performance</h3>
              {analytics?.studentPerformance && analytics.studentPerformance.length > 0 ? (
                <div className="space-y-3">
                  {analytics.studentPerformance.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                          {student.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{student.name}</div>
                          <div className="text-neutral-500 text-sm">{student.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className={`text-lg font-bold ${
                              student.averageScore >= 70 ? 'text-green-400' :
                              student.averageScore >= 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {student.averageScore?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <div className="text-neutral-500 text-sm">
                            {student.completedQuizzes || 0} quizzes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No student performance data available
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {quizAnalytics.length > 0 ? (
              quizAnalytics.map((quiz, idx) => (
                <Card key={idx}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
                      <p className="text-neutral-400 text-sm">{quiz.totalAttempts || 0} attempts</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {quiz.averageScore?.toFixed(1) || 0}%
                      </div>
                      <div className="text-neutral-500 text-sm">avg score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-neutral-700/50 rounded-lg">
                      <div className="text-green-400 font-bold">{quiz.passRate?.toFixed(1) || 0}%</div>
                      <div className="text-neutral-500 text-sm">Pass Rate</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-700/50 rounded-lg">
                      <div className="text-white font-bold">{quiz.highestScore || 0}%</div>
                      <div className="text-neutral-500 text-sm">Highest</div>
                    </div>
                    <div className="text-center p-3 bg-neutral-700/50 rounded-lg">
                      <div className="text-white font-bold">{quiz.lowestScore || 0}%</div>
                      <div className="text-neutral-500 text-sm">Lowest</div>
                    </div>
                  </div>

                  {quiz.questionAnalysis && quiz.questionAnalysis.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-400 mb-3">Question Analysis</h4>
                      <div className="space-y-2">
                        {quiz.questionAnalysis.slice(0, 5).map((q, qIdx) => (
                          <div key={qIdx} className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-neutral-600 rounded text-xs text-white">
                              {qIdx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="w-full bg-neutral-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    q.correctRate >= 70 ? 'bg-green-500' :
                                    q.correctRate >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${q.correctRate || 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-neutral-400 text-sm w-12 text-right">
                              {q.correctRate?.toFixed(0) || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-neutral-400">No quiz analytics available yet</p>
              </Card>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            {/* AI Insights Header */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">AI-Powered Insights</h3>
                    <p className="text-neutral-400 text-sm">
                      Get intelligent analysis and recommendations based on your class performance data.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={loadAIInsights}
                  loading={insightsLoading}
                >
                  {aiInsights ? 'Refresh Insights' : 'Generate Insights'}
                </Button>
              </div>
            </Card>

            {/* AI Insights Content */}
            {insightsLoading ? (
              <Card className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-neutral-400">Analyzing class performance with AI...</p>
              </Card>
            ) : aiInsights ? (
              <>
                {/* Metrics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {aiInsights.data?.metrics?.totalQuizzes || 0}
                    </div>
                    <div className="text-neutral-400 text-sm">Total Quizzes</div>
                  </Card>
                  <Card className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {aiInsights.data?.metrics?.totalAttempts || 0}
                    </div>
                    <div className="text-neutral-400 text-sm">Total Attempts</div>
                  </Card>
                  <Card className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${
                      (aiInsights.data?.metrics?.averageScore || 0) >= 70 ? 'text-green-400' :
                      (aiInsights.data?.metrics?.averageScore || 0) >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {aiInsights.data?.metrics?.averageScore || 0}%
                    </div>
                    <div className="text-neutral-400 text-sm">Average Score</div>
                  </Card>
                  <Card className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${
                      (aiInsights.data?.metrics?.highPerformanceRate || 0) >= 50 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {aiInsights.data?.metrics?.highPerformanceRate || 0}%
                    </div>
                    <div className="text-neutral-400 text-sm">High Performers</div>
                  </Card>
                </div>

                {/* AI Analysis */}
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">AI Analysis & Recommendations</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                      {aiInsights.data?.aiInsights || 'No insights available.'}
                    </div>
                  </div>
                  {aiInsights.data?.generated && (
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <p className="text-xs text-neutral-500">
                        ✨ Generated by AI based on your class performance data
                      </p>
                    </div>
                  )}
                </Card>

                {/* Performance Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Distribution</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">High Performers (80%+)</span>
                          <span className="text-green-400">{aiInsights.data?.metrics?.highPerformanceRate || 0}%</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${aiInsights.data?.metrics?.highPerformanceRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">Low Performers (&lt;60%)</span>
                          <span className="text-red-400">{aiInsights.data?.metrics?.lowPerformanceRate || 0}%</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${aiInsights.data?.metrics?.lowPerformanceRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link 
                        to={`/teacher/quiz-builder/${classId}`}
                        className="flex items-center gap-3 p-3 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
                      >
                        <div className="p-2 bg-primary/20 rounded">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div className="text-white">Create AI-Generated Quiz</div>
                      </Link>
                      <Link 
                        to={`/teacher/materials/${classId}`}
                        className="flex items-center gap-3 p-3 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
                      >
                        <div className="p-2 bg-blue-500/20 rounded">
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <div className="text-white">Upload New Materials</div>
                      </Link>
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="text-center py-16">
                <svg className="w-20 h-20 mx-auto text-neutral-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">AI Insights Ready</h3>
                <p className="text-neutral-400 mb-6">
                  Click the button above to generate AI-powered insights for your class.
                </p>
                <Button variant="primary" onClick={loadAIInsights} loading={insightsLoading}>
                  Generate AI Insights
                </Button>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;

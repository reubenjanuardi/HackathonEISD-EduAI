import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useAuthStore, useClassStore } from '../../stores';
import { getStudentProgress } from '../../services/api';

const StudentDashboard = () => {
  const { profile } = useAuthStore();
  const { classes, fetchStudentClasses, enrollByCode, loading, error } = useClassStore();
  const { addToast } = useToast();
  
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchStudentClasses();
    loadProgress();
  }, [fetchStudentClasses]);

  const loadProgress = async () => {
    try {
      const data = await getStudentProgress();
      setProgress(data);
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    const success = await enrollByCode(enrollmentCode);
    if (success) {
      addToast('Successfully enrolled in class!', 'success');
      setShowEnrollModal(false);
      setEnrollmentCode('');
    } else {
      addToast(error || 'Failed to enroll. Check the code and try again.', 'error');
    }
    setEnrolling(false);
  };

  const upcomingQuizzes = progress?.upcomingQuizzes || [];
  const recentResults = progress?.recentResults || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {profile?.name || 'Student'}! 👋
              </h1>
              <p className="text-neutral-400">Track your progress and take quizzes</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Join Class
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{classes.length}</div>
            <div className="text-neutral-400">Enrolled Classes</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">
              {progress?.averageScore?.toFixed(1) || 0}%
            </div>
            <div className="text-neutral-400">Average Score</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {progress?.completedQuizzes || 0}
            </div>
            <div className="text-neutral-400">Quizzes Completed</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {upcomingQuizzes.length}
            </div>
            <div className="text-neutral-400">Upcoming Quizzes</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">My Classes</h2>
              <Link to="/student/classes" className="text-primary hover:text-primary/80 text-sm">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No classes yet</h3>
                <p className="text-neutral-400 mb-4">Join a class with an enrollment code</p>
                <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
                  Join Class
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 4).map((enrollment) => {
                  const cls = enrollment.classes;
                  if (!cls) return null;
                  return (
                    <Link key={enrollment.id} to={`/student/classes/${cls.id}`}>
                      <Card className="hover:border-primary/50 transition-all duration-200">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: cls.color || '#6366f1' }}
                          >
                            {cls.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{cls.name}</h3>
                            <p className="text-neutral-400 text-sm">{cls.subject}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Quizzes */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Quizzes</h3>
              {upcomingQuizzes.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-4">
                  No upcoming quizzes
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingQuizzes.slice(0, 3).map((quiz) => (
                    <Link 
                      key={quiz.id} 
                      to={`/student/quiz/${quiz.id}`}
                      className="block p-3 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      <h4 className="text-white font-medium">{quiz.title}</h4>
                      <p className="text-neutral-400 text-sm">
                        {quiz.className} • {quiz.time_limit} min
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Results */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Results</h3>
              {recentResults.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-4">
                  No quiz results yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentResults.slice(0, 3).map((result) => (
                    <div key={result.id} className="p-3 bg-neutral-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{result.quizTitle}</h4>
                        <span className={`text-lg font-bold ${
                          result.score >= 70 ? 'text-green-400' :
                          result.score >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.score}%
                        </span>
                      </div>
                      <p className="text-neutral-500 text-sm">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Link 
                to="/student/progress" 
                className="block text-center text-primary hover:text-primary/80 text-sm mt-4"
              >
                View All Progress →
              </Link>
            </Card>
          </div>
        </div>

        {/* Enroll Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title="Join a Class"
        >
          <form onSubmit={handleEnroll} className="space-y-4">
            <p className="text-neutral-400">
              Enter the enrollment code provided by your teacher to join a class.
            </p>
            <Input
              label="Enrollment Code"
              placeholder="e.g., ABC123"
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
              required
              className="font-mono text-center text-xl"
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowEnrollModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={enrolling}
              >
                Join Class
              </Button>
            </div>
          </form>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

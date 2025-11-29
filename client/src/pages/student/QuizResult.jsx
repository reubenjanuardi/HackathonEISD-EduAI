import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useQuizStore } from '../../stores';

const QuizResult = () => {
  const { classId, quizId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentAttempt } = useQuizStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAttempt) {
      setLoading(false);
    } else {
      // No attempt data available, redirect
      addToast('No quiz attempt found', 'error');
      navigate(`/student/class/${classId}`, { replace: true });
    }
  }, [currentAttempt, classId, navigate, addToast]);

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

  if (!currentAttempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo={`/student/class/${classId}`} backLabel="Back to Class" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-neutral-400">Quiz result not found</p>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/student/class/${classId}`)}
              className="mt-4"
            >
              Back to Class
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const score = currentAttempt.score || 0;
  const totalQuestions = currentAttempt.total_questions || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const isPassed = percentage >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar showBack backTo={`/student/class/${classId}`} backLabel="Back to Class" />
      
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Score Card */}
          <Card className="mb-8 text-center py-12">
            {/* Result Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isPassed ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {isPassed ? (
                <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Percentage Score */}
            <h2 className={`text-6xl font-bold mb-4 ${isPassed ? 'text-green-400' : 'text-yellow-400'}`}>
              {percentage}%
            </h2>
            
            {/* Score Details */}
            <p className="text-2xl text-neutral-300 mb-4">
              {score} out of {totalQuestions} correct
            </p>
            
            {/* Message */}
            <p className={`text-lg font-medium ${isPassed ? 'text-green-400' : 'text-yellow-400'}`}>
              {isPassed ? '🎉 Excellent work!' : '💪 Keep practicing!'}
            </p>
          </Card>

          {/* Score Breakdown */}
          <Card title="Score Breakdown" className="mb-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-neutral-400 text-sm mb-2">Correct Answers</p>
                <p className="text-3xl font-bold text-green-400">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-neutral-400 text-sm mb-2">Incorrect Answers</p>
                <p className="text-3xl font-bold text-red-400">{totalQuestions - score}</p>
              </div>
              <div className="text-center">
                <p className="text-neutral-400 text-sm mb-2">Total Questions</p>
                <p className="text-3xl font-bold text-primary">{totalQuestions}</p>
              </div>
            </div>
          </Card>

          {/* Pass/Fail Status */}
          {isPassed ? (
            <Card className="mb-8 border-2 border-green-500/30 bg-green-500/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">Quiz Passed!</h3>
                  <p className="text-neutral-400 text-sm">
                    You've successfully completed this quiz with a passing score. Great job!
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="mb-8 border-2 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-1">Keep Practicing</h3>
                  <p className="text-neutral-400 text-sm">
                    You didn't quite reach the passing score yet. Review the material and try again to improve your score.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/student/class/${classId}`)}
            >
              Back to Class
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate('/student/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;

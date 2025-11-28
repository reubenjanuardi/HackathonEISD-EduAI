import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { getQuizResult } from '../services/api';

const QuizResult = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const data = await getQuizResult(id);
      setResult(data);
    } catch (error) {
      addToast('Failed to load quiz results', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const percentage = (result.score / result.totalQuestions) * 100;
  const isPassed = percentage >= 70;

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Quiz Results</h1>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <Card className="mb-8 text-center">
          <div className="py-8">
            {/* Result Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isPassed ? 'bg-accent/20' : 'bg-yellow-500/20'
            }`}>
              {isPassed ? (
                <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Score */}
            <h2 className={`text-6xl font-bold mb-2 ${isPassed ? 'text-accent' : 'text-yellow-500'}`}>
              {percentage.toFixed(0)}%
            </h2>
            <p className="text-2xl text-neutral-300 mb-4">
              {result.score} out of {result.totalQuestions} correct
            </p>
            <p className={`text-lg font-medium ${isPassed ? 'text-accent' : 'text-yellow-500'}`}>
              {isPassed ? '🎉 Great job!' : '💪 Keep practicing!'}
            </p>
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card title="AI Learning Recommendations" className="mb-8">
          <div className="space-y-4">
            {result.recommendations?.map((rec, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-neutral-700/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-neutral-200">{rec}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary">Personalized by AI</p>
                <p className="text-xs text-neutral-400 mt-1">
                  These recommendations are generated based on your quiz performance using AI/ML API.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Question Breakdown */}
        <Card title="Question Breakdown" className="mb-8">
          <div className="space-y-3">
            {result.answers?.map((answer, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  answer.correct
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    answer.correct ? 'bg-accent' : 'bg-red-500'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {answer.correct ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 font-medium mb-1">Question {idx + 1}</p>
                    <p className="text-sm text-neutral-400">{answer.question}</p>
                    {!answer.correct && (
                      <p className="text-sm text-neutral-500 mt-2">
                        Correct answer: <span className="text-accent">{answer.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/quiz')}>
            Retake Quiz
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default QuizResult;

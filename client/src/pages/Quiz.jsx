import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { startQuiz, submitAnswer } from '../services/api';

const Quiz = () => {
  const [quizSession, setQuizSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    try {
      const data = await startQuiz();
      setQuizSession(data);
      setCurrentQuestion(data.currentQuestion);
      setQuestionNumber(1);
    } catch (error) {
      addToast('Failed to start quiz', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null) {
      addToast('Please select an answer', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitAnswer(
        quizSession.quizId,
        currentQuestion.id,
        selectedAnswer
      );

      if (data.completed) {
        addToast('Quiz completed!', 'success');
        navigate(`/quiz/result/${quizSession.quizId}`);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setQuestionNumber(questionNumber + 1);
        setSelectedAnswer(null);
      }
    } catch (error) {
      addToast('Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const progress = (questionNumber / 10) * 100;

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Adaptive Quiz</h1>
            <div className="flex items-center gap-4">
              <span className="text-neutral-400">
                Question {questionNumber} of 10
              </span>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Exit Quiz
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{questionNumber}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {currentQuestion?.question}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentQuestion?.difficulty === 'easy' ? 'bg-accent/20 text-accent' :
                    currentQuestion?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {currentQuestion?.difficulty?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion?.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(idx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === idx
                      ? 'border-primary bg-primary/20'
                      : 'border-neutral-700 hover:border-neutral-600 bg-neutral-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === idx ? 'border-primary bg-primary' : 'border-neutral-500'
                    }`}>
                      {selectedAnswer === idx && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-neutral-200">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleAnswerSubmit}
              loading={submitting}
              disabled={selectedAnswer === null}
            >
              {questionNumber === 10 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-neutral-800/50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-neutral-300">
                This quiz uses adaptive difficulty. Questions will become easier or harder based on your performance.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Quiz;

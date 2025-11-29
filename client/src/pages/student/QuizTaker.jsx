import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useQuizStore } from '../../stores';

const QuizTaker = () => {
  const { quizId, classId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { 
    currentQuiz,
    currentAttempt,
    fetchQuizDetail, 
    startAttempt,
    submitAnswer,
    completeAttempt,
    loading 
  } = useQuizStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (quizId) {
      fetchQuizDetail(quizId);
    }
  }, [quizId, fetchQuizDetail]);

  useEffect(() => {
    if (currentQuiz && !currentAttempt) {
      // Auto-start attempt when quiz is loaded
      handleStartAttempt();
    }
  }, [currentQuiz]);

  // Update selectedAnswer when currentQuestionIndex changes
  useEffect(() => {
    const questions = currentQuiz?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    if (currentQ) {
      setSelectedAnswer(answers[currentQ.id] || '');
    }
  }, [currentQuestionIndex, currentQuiz, answers]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleStartAttempt = async () => {
    if (!quizId || !classId) {
      addToast('Quiz or class information missing', 'error');
      return;
    }
    const attempt = await startAttempt(quizId, classId);
    if (attempt?.success && currentQuiz) {
      setTimeLeft(currentQuiz.time_limit * 60);
    } else {
      addToast('Failed to start quiz attempt', 'error');
    }
  };

  const handleAnswerSelect = (answer) => {
    const questions = currentQuiz?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setSelectedAnswer(answer);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: answer
    }));
  };

  const handleNext = async () => {
    const questions = currentQuiz?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    
    if (!currentAttempt || !currentQ) {
      addToast('Error loading question', 'error');
      return;
    }

    // Don't require answer, but warn if empty
    if (!selectedAnswer) {
      addToast('Please answer the question before moving forward', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Submit the current answer
      const result = await submitAnswer(currentQ.id, selectedAnswer);
      
      if (!result?.success) {
        addToast('Failed to save answer', 'error');
        setSubmitting(false);
        return;
      }
      
      // Check if there are more questions
      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question - the useEffect will handle loading the answer
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Last question answered, finish the quiz
        await handleFinish();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      addToast('Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Move to previous question - the useEffect will handle loading the answer
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = async () => {
    if (!currentAttempt) {
      addToast('Error: No active quiz attempt', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await completeAttempt();
      if (result?.success) {
        addToast('Quiz completed!', 'success');
        navigate(`/student/class/${classId}/quiz/${quizId}/result`, { 
          state: { attempt: result.data } 
        });
      } else {
        addToast('Failed to complete quiz: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Error completing quiz:', err);
      addToast('Failed to complete quiz: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Debug: Check if params are available
  if (!quizId || !classId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-red-400 font-semibold mb-2">Error: Missing Parameters</p>
            <p className="text-neutral-400 mb-2">Quiz ID: {quizId || 'NOT PROVIDED'}</p>
            <p className="text-neutral-400 mb-4">Class ID: {classId || 'NOT PROVIDED'}</p>
            <Link to="/student/dashboard" className="text-primary hover:underline inline-block">
              Back to Dashboard
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (loading && !currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo={`/student/class/${classId}`} backLabel="Back to Class" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo={`/student/class/${classId}`} backLabel="Back to Class" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-neutral-400">Quiz not found</p>
            <Link to="/student/dashboard" className="text-primary hover:underline mt-2 inline-block">
              Back to Dashboard
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const questions = currentQuiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo="/student/classes" backLabel="Classes" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-neutral-400">This quiz has no questions</p>
            <Link to="/student/dashboard" className="text-primary hover:underline mt-2 inline-block">
              Back to Dashboard
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar showBack backTo={`/student/class/${classId}`} backLabel="Back to Class" />
      
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">{currentQuiz.title}</h1>
            {timeLeft !== null && (
              <div className={`px-4 py-2 rounded-lg font-mono text-lg ${
                timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-neutral-700 text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-neutral-400 text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-2 py-1 text-xs rounded ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              currentQuestion.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-neutral-500 text-sm">{currentQuestion.points} points</span>
          </div>

          <h2 className="text-xl text-white mb-6">{currentQuestion.question_text}</h2>

          {/* Answer Options */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => (
                <button
                  key={idx}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedAnswer === option
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'
                  }`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === option
                        ? 'border-primary bg-primary'
                        : 'border-neutral-500'
                    }`}>
                      {selectedAnswer === option && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {['True', 'False'].map((option) => (
                <button
                  key={option}
                  className={`p-6 rounded-lg border text-center font-medium transition-all ${
                    selectedAnswer === option.toLowerCase()
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'
                  }`}
                  onClick={() => handleAnswerSelect(option.toLowerCase())}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <textarea
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-primary resize-none"
              rows={4}
              placeholder="Type your answer here..."
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(e.target.value)}
            />
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <div className="flex gap-2">
            {questions.map((q, idx) => (
              <button
                key={idx}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  idx === currentQuestionIndex
                    ? 'bg-primary text-white'
                    : answers[q?.id]
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setSelectedAnswer(answers[q?.id] || '');
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleFinish}
              loading={submitting}
              disabled={submitting}
            >
              Finish Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              loading={submitting}
              disabled={submitting}
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;

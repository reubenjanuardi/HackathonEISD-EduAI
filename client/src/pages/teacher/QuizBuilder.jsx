import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore, useQuizStore } from '../../stores';
import { generateQuiz, getMaterials } from '../../services/api';

const QuizBuilder = () => {
  const { classId } = useParams();
  const { addToast } = useToast();
  const { currentClass, fetchClassDetail } = useClassStore();
  const { 
    quizzes, 
    currentQuiz,
    fetchQuizzes, 
    createQuiz, 
    addQuestion,
    publishQuiz,
    loading 
  } = useQuizStore();

  const [materials, setMaterials] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    time_limit: 30,
    is_adaptive: false
  });

  const [aiForm, setAiForm] = useState({
    materialId: '',
    topic: '',
    numQuestions: 5,
    difficulty: 'medium'
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 10,
    difficulty: 'medium'
  });

  useEffect(() => {
    if (classId) {
      fetchClassDetail(classId);
      fetchQuizzes(classId);
      loadMaterials();
    }
  }, [classId, fetchClassDetail, fetchQuizzes]);

  const loadMaterials = async () => {
    try {
      const data = await getMaterials(classId);
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const quiz = await createQuiz(classId, quizForm);
    if (quiz) {
      addToast('Quiz created successfully!', 'success');
      setShowCreateModal(false);
      setQuizForm({ title: '', description: '', time_limit: 30, is_adaptive: false });
    } else {
      addToast('Failed to create quiz', 'error');
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const result = await generateQuiz({
        classId,
        materialId: aiForm.materialId || undefined,
        topic: aiForm.topic,
        numQuestions: aiForm.numQuestions,
        difficulty: aiForm.difficulty
      });

      addToast(`Generated quiz with ${result.questions?.length || 0} questions!`, 'success');
      setShowAIModal(false);
      setAiForm({ materialId: '', topic: '', numQuestions: 5, difficulty: 'medium' });
      fetchQuizzes(classId);
    } catch (err) {
      addToast(err.message || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    const questionData = {
      ...questionForm,
      options: questionForm.question_type === 'multiple_choice' 
        ? questionForm.options.filter(o => o.trim()) 
        : undefined
    };

    const question = await addQuestion(selectedQuiz.id, questionData);
    if (question) {
      addToast('Question added!', 'success');
      setShowQuestionModal(false);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 10,
        difficulty: 'medium'
      });
      fetchQuizzes(classId);
    } else {
      addToast('Failed to add question', 'error');
    }
  };

  const handlePublish = async (quizId) => {
    const success = await publishQuiz(quizId);
    if (success) {
      addToast('Quiz published!', 'success');
      fetchQuizzes(classId);
    } else {
      addToast('Failed to publish quiz', 'error');
    }
  };

  const openAddQuestion = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuestionModal(true);
  };

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
              <h1 className="text-3xl font-bold text-white">Quiz Builder</h1>
              <p className="text-neutral-400">{currentClass?.name || 'Loading...'}</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button variant="secondary" onClick={() => setShowAIModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Generate
              </Button>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Quiz
              </Button>
            </div>
          </div>

        {/* Quizzes List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-neutral-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No quizzes yet</h3>
            <p className="text-neutral-400 mb-6">Create your first quiz or use AI to generate one</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setShowAIModal(true)}>
                AI Generate
              </Button>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Quiz
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{quiz.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        quiz.is_published 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </span>
                      {quiz.is_adaptive && (
                        <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                          Adaptive
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 text-sm mb-3">
                      {quiz.description || 'No description'}
                    </p>
                    <div className="flex gap-4 text-sm text-neutral-500">
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>{quiz.time_limit} min</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => openAddQuestion(quiz)}
                    >
                      Add Question
                    </Button>
                    {!quiz.is_published && (
                      <Button 
                        variant="primary"
                        onClick={() => handlePublish(quiz.id)}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </div>

                {/* Questions Preview */}
                {quiz.questions && quiz.questions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-neutral-700">
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">Questions</h4>
                    <div className="space-y-2">
                      {quiz.questions.slice(0, 3).map((q, idx) => (
                        <div key={q.id} className="flex items-center gap-3 p-3 bg-neutral-700/50 rounded-lg">
                          <span className="w-6 h-6 flex items-center justify-center bg-neutral-600 rounded text-xs text-white">
                            {idx + 1}
                          </span>
                          <span className="text-neutral-300 text-sm flex-1 truncate">
                            {q.question_text}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                            q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-neutral-500 text-xs">{q.points} pts</span>
                        </div>
                      ))}
                      {quiz.questions.length > 3 && (
                        <p className="text-sm text-neutral-500 text-center py-2">
                          +{quiz.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Quiz Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Quiz"
        >
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <Input
              label="Title"
              placeholder="Quiz title"
              value={quizForm.title}
              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Quiz description..."
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
              />
            </div>

            <Input
              label="Time Limit (minutes)"
              type="number"
              min={1}
              max={180}
              value={quizForm.time_limit}
              onChange={(e) => setQuizForm({ ...quizForm, time_limit: parseInt(e.target.value) || 30 })}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAdaptive"
                checked={quizForm.is_adaptive}
                onChange={(e) => setQuizForm({ ...quizForm, is_adaptive: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-primary focus:ring-primary"
              />
              <label htmlFor="isAdaptive" className="text-neutral-300">
                Enable Adaptive Mode (AI adjusts difficulty based on performance)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={loading}
              >
                Create Quiz
              </Button>
            </div>
          </form>
        </Modal>

        {/* AI Generate Modal */}
        <Modal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          title="AI Quiz Generator"
        >
          <form onSubmit={handleAIGenerate} className="space-y-4">
            <p className="text-neutral-400 text-sm mb-4">
              Generate quiz questions using AI based on your course materials or a specific topic.
            </p>

            {materials.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Based on Material (optional)
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  value={aiForm.materialId}
                  onChange={(e) => setAiForm({ ...aiForm, materialId: e.target.value })}
                >
                  <option value="">Select a material...</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Topic"
              placeholder="e.g., Quadratic equations, World War II..."
              value={aiForm.topic}
              onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              required={!aiForm.materialId}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Number of Questions"
                type="number"
                min={1}
                max={20}
                value={aiForm.numQuestions}
                onChange={(e) => setAiForm({ ...aiForm, numQuestions: parseInt(e.target.value) || 5 })}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Difficulty
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  value={aiForm.difficulty}
                  onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAIModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={generating}
              >
                Generate Quiz
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Question Modal */}
        <Modal
          isOpen={showQuestionModal}
          onClose={() => setShowQuestionModal(false)}
          title={`Add Question to: ${selectedQuiz?.title}`}
        >
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Question Type
              </label>
              <select
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary"
                value={questionForm.question_type}
                onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Question
              </label>
              <textarea
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Enter your question..."
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                required
              />
            </div>

            {questionForm.question_type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Options
                </label>
                {questionForm.options.map((option, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    className="mb-2"
                  />
                ))}
              </div>
            )}

            {questionForm.question_type === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Correct Answer
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="true"
                      checked={questionForm.correct_answer === 'true'}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                      className="text-primary focus:ring-primary"
                    />
                    True
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="false"
                      checked={questionForm.correct_answer === 'false'}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                      className="text-primary focus:ring-primary"
                    />
                    False
                  </label>
                </div>
              </div>
            )}

            {questionForm.question_type !== 'true_false' && (
              <Input
                label="Correct Answer"
                placeholder="Enter the correct answer"
                value={questionForm.correct_answer}
                onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                required
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Points"
                type="number"
                min={1}
                max={100}
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 10 })}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Difficulty
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowQuestionModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={loading}
              >
                Add Question
              </Button>
            </div>
          </form>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;

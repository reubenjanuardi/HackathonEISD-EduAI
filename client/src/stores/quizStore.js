import { create } from 'zustand';
import api from '../services/api';

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  currentAttempt: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  loading: false,
  error: null,

  // Fetch quizzes for a class
  fetchQuizzes: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/quizzes/class/${classId}`);
      set({ quizzes: response.data.data || [], loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false, quizzes: [] });
      return { success: false, error: error.message };
    }
  },

  // Get quiz detail with questions
  fetchQuizDetail: async (quizId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/quizzes/detail/${quizId}`);
      const quiz = response.data.data;
      set({
        currentQuiz: quiz,
        questions: quiz.questions || [],
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Create a new quiz (teacher)
  createQuiz: async (classId, quizData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/quizzes', { ...quizData, class_id: classId });
      const newQuiz = response.data.data;
      set((state) => ({
        quizzes: [...state.quizzes, newQuiz],
        loading: false,
      }));
      return newQuiz;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Add question to quiz
  addQuestion: async (quizId, questionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/quizzes/${quizId}/questions`, questionData);
      const newQuestion = response.data.data;
      set((state) => ({
        questions: [...state.questions, newQuestion],
        // Also update the quiz in quizzes array to reflect new question
        quizzes: state.quizzes.map((quiz) => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: [...(quiz.questions || []), newQuestion]
            };
          }
          return quiz;
        }),
        loading: false,
      }));
      return newQuestion;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Update question
  updateQuestion: async (questionId, questionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/quizzes/questions/${questionId}`, questionData);
      const updatedQuestion = response.data.data;
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === questionId ? updatedQuestion : q
        ),
        loading: false,
      }));
      return { success: true, data: updatedQuestion };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Delete question
  deleteQuestion: async (questionId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/quizzes/questions/${questionId}`);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Publish quiz
  publishQuiz: async (quizId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/quizzes/${quizId}/publish`);
      const publishedQuiz = response.data.data;
      set((state) => ({
        quizzes: state.quizzes.map((q) =>
          q.id === quizId ? publishedQuiz : q
        ),
        currentQuiz: state.currentQuiz?.id === quizId ? publishedQuiz : state.currentQuiz,
        loading: false,
      }));
      return { success: true, data: publishedQuiz };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Start a quiz attempt (student)
  startAttempt: async (quizId, classId) => {
    set({ loading: true, error: null, currentQuestionIndex: 0, answers: {} });
    try {
      const response = await api.post('/attempts', { quizId, classId });
      set({
        currentAttempt: response.data.data,
        loading: false,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Submit answer
  submitAnswer: async (questionId, answer) => {
    const { currentAttempt, answers } = get();
    if (!currentAttempt) return { success: false, error: 'No active attempt' };

    set({ loading: true, error: null });
    try {
      const response = await api.post(`/attempts/${currentAttempt.id}/answer`, {
        questionId,
        answer,
      });
      set((state) => ({
        answers: { ...state.answers, [questionId]: answer },
        loading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Complete attempt
  completeAttempt: async () => {
    const { currentAttempt } = get();
    if (!currentAttempt) return { success: false, error: 'No active attempt' };

    set({ loading: true, error: null });
    try {
      const response = await api.post(`/attempts/${currentAttempt.id}/complete`);
      set({
        currentAttempt: response.data.data,
        loading: false,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Get attempt details
  fetchAttempt: async (attemptId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/attempts/${attemptId}`);
      set({
        currentAttempt: response.data.data,
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Get my attempts for a class
  fetchMyAttempts: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/attempts/class/${classId}/student`);
      return { success: true, data: response.data.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Navigation
  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  goToQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  // Set local answer (before submitting)
  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  // Clear state
  clearQuiz: () => set({
    currentQuiz: null,
    currentAttempt: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    error: null,
  }),

  clearError: () => set({ error: null }),
}));

export default useQuizStore;

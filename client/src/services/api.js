import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // First try Zustand store, fallback to localStorage
  const token = useAuthStore.getState().getToken() || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - sign out
      useAuthStore.getState().signOut();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  signup: async (email, password, metadata) => {
    const response = await api.post('/auth/signup', { email, password, ...metadata });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// ============================================
// CLASSES API
// ============================================
export const classAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  enrollStudent: (classId, studentId) => api.post(`/classes/${classId}/enroll`, { studentId }),
  unenrollStudent: (classId, studentId) => api.delete(`/classes/${classId}/unenroll/${studentId}`),
  enrollByCode: (code) => api.post('/classes/enroll-by-code', { code }),
};

// ============================================
// MATERIALS API
// ============================================
export const materialAPI = {
  upload: async (classId, file, title, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId);
    formData.append('title', title);
    formData.append('description', description || '');
    
    const response = await api.post('/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getByClass: (classId) => api.get(`/materials/${classId}`),
  getById: (id) => api.get(`/materials/detail/${id}`),
  summarize: (id) => api.post(`/materials/${id}/summarize`),
  delete: (id) => api.delete(`/materials/${id}`),
};

// ============================================
// QUIZZES API
// ============================================
export const quizAPI = {
  getByClass: (classId) => api.get(`/quizzes/${classId}`),
  getById: (id) => api.get(`/quizzes/detail/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  publish: (id) => api.post(`/quizzes/${id}/publish`),
  // Questions
  addQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId, data) => api.put(`/quizzes/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/quizzes/questions/${questionId}`),
};

// ============================================
// ATTEMPTS API
// ============================================
export const attemptAPI = {
  start: (quizId, classId) => api.post('/attempts', { quizId, classId }),
  getById: (id) => api.get(`/attempts/${id}`),
  submitAnswer: (attemptId, questionId, answer) => 
    api.post(`/attempts/${attemptId}/answer`, { questionId, answer }),
  complete: (attemptId) => api.post(`/attempts/${attemptId}/complete`),
  getByQuiz: (quizId) => api.get(`/attempts/quiz/${quizId}`),
  getMyAttempts: (classId) => api.get(`/attempts/class/${classId}/student`),
  delete: (id) => api.delete(`/attempts/${id}`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  getClassAnalytics: (classId) => api.get(`/analytics/class/${classId}`),
  getQuizAnalytics: (quizId) => api.get(`/analytics/quiz/${quizId}`),
  getDifficultyAnalysis: (quizId) => api.get(`/analytics/quiz/${quizId}/difficulty`),
  getAtRiskStudents: (classId) => api.get(`/analytics/class/${classId}/at-risk`),
  getStudentProgress: () => api.get('/analytics/student/progress'),
  updateProgress: (studentId, classId) => 
    api.post(`/analytics/student/${studentId}/progress`, { classId }),
};

// ============================================
// AI API
// ============================================
export const aiAPI = {
  // Quiz Generation
  generateQuiz: (materialId, classId, options = {}) => 
    api.post('/ai/generate-quiz', { materialId, classId, ...options }),
  generateQuizFromText: (classId, content, options = {}) =>
    api.post('/ai/generate-quiz-from-text', { classId, content, ...options }),
  generateAdaptiveQuiz: (classId, topicId) => 
    api.post('/ai/generate-adaptive-quiz', { classId, topicId }),
  
  // Material Summarization
  summarizeMaterial: (materialId) => api.post('/ai/summarize-material', { materialId }),
  
  // Insights & Analytics
  getInsights: (classId) => api.get(`/ai/insights/${classId}`),
  getRecommendations: (classId) => api.get(`/ai/student-recommendations/${classId}`),
  analyzeQuizDifficulty: (quizId) => api.get(`/ai/quiz-difficulty/${quizId}`),
  
  // Health Check
  checkHealth: () => api.get('/ai/health'),
};

// ============================================
// EXPORT API
// ============================================
export const exportAPI = {
  classGradesCSV: (classId) => 
    api.get(`/export/class/${classId}/grades.csv`, { responseType: 'blob' }),
  classGradesXLSX: (classId) => 
    api.get(`/export/class/${classId}/grades.xlsx`, { responseType: 'blob' }),
  quizResultsCSV: (quizId) => 
    api.get(`/export/quiz/${quizId}/results.csv`, { responseType: 'blob' }),
  studentTranscript: (studentId) => 
    api.get(`/export/student/${studentId}/transcript`, { responseType: 'blob' }),
  classAnalytics: (classId) => 
    api.get(`/export/class/${classId}/analytics`, { responseType: 'blob' }),
};

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
export const login = authAPI.login;
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};
export const uploadGrades = materialAPI.upload;
export const generateInsights = aiAPI.getInsights;
export const startQuiz = attemptAPI.start;
export const submitAnswer = attemptAPI.submitAnswer;
export const getQuizResult = attemptAPI.getById;

// ============================================
// CONVENIENCE EXPORTS (for use in components)
// ============================================

// Classes
export const getClasses = async () => {
  const response = await classAPI.getAll();
  return response.data;
};
export const getClassDetail = async (id) => {
  const response = await classAPI.getById(id);
  return response.data;
};
export const createClass = async (data) => {
  const response = await classAPI.create(data);
  return response.data;
};
export const updateClass = async (id, data) => {
  const response = await classAPI.update(id, data);
  return response.data;
};
export const deleteClass = async (id) => {
  await classAPI.delete(id);
  return true;
};
export const enrollStudent = async (classId, studentId) => {
  const response = await classAPI.enrollStudent(classId, studentId);
  return response.data;
};
export const unenrollStudent = async (classId, studentId) => {
  await classAPI.unenrollStudent(classId, studentId);
  return true;
};
export const enrollByCode = async (code) => {
  const response = await classAPI.enrollByCode(code);
  return response.data;
};
export const getStudentClasses = async () => {
  const response = await api.get('/classes/student/enrolled');
  return response.data;
};

// Materials
export const uploadMaterial = async (classId, formData) => {
  // Ensure classId is in formData
  if (!formData.has('classId')) {
    formData.append('classId', classId);
  }
  const response = await api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
export const getMaterials = async (classId) => {
  try {
    const response = await api.get(`/materials/class/${classId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
};
export const deleteMaterial = async (id) => {
  await materialAPI.delete(id);
  return true;
};
export const summarizeMaterial = async (id) => {
  const response = await materialAPI.summarize(id);
  return response.data;
};

// Quizzes
export const getQuizzes = async (classId) => {
  const response = await quizAPI.getByClass(classId);
  return response.data;
};
export const getQuizDetail = async (id) => {
  const response = await quizAPI.getById(id);
  return response.data;
};
export const createQuiz = async (classId, data) => {
  const response = await quizAPI.create({ ...data, classId });
  return response.data;
};
export const addQuestion = async (quizId, data) => {
  const response = await quizAPI.addQuestion(quizId, data);
  return response.data;
};
export const publishQuiz = async (id) => {
  const response = await quizAPI.publish(id);
  return response.data;
};

// Attempts
export const startAttempt = async (quizId, classId) => {
  const response = await attemptAPI.start(quizId, classId);
  return response.data;
};
export const submitAttemptAnswer = async (attemptId, questionId, answer) => {
  const response = await attemptAPI.submitAnswer(attemptId, questionId, answer);
  return response.data;
};
export const completeAttempt = async (attemptId) => {
  const response = await attemptAPI.complete(attemptId);
  return response.data;
};
export const getAttempt = async (id) => {
  const response = await attemptAPI.getById(id);
  return response.data;
};

// Analytics
export const getClassAnalytics = async (classId) => {
  const response = await analyticsAPI.getClassAnalytics(classId);
  return response.data;
};
export const getQuizAnalytics = async (quizId) => {
  const response = await analyticsAPI.getQuizAnalytics(quizId);
  return response.data;
};
export const getAtRiskStudents = async (classId) => {
  const response = await analyticsAPI.getAtRiskStudents(classId);
  return response.data;
};
export const getStudentProgress = async () => {
  const response = await analyticsAPI.getStudentProgress();
  return response.data;
};

// AI
export const generateQuiz = async (options) => {
  // If materialId is provided, use material-based generation
  if (options.materialId) {
    const response = await aiAPI.generateQuiz(options.materialId, options.classId, {
      numQuestions: options.numQuestions,
      difficulty: options.difficulty,
    });
    return response.data;
  }
  
  // Otherwise, use text/topic-based generation
  const response = await aiAPI.generateQuizFromText(options.classId, options.topic || options.content, {
    title: options.title || `Quiz on ${options.topic}`,
    numQuestions: options.numQuestions,
    difficulty: options.difficulty,
  });
  return response.data;
};

export const getAIInsights = async (classId) => {
  const response = await aiAPI.getInsights(classId);
  return response.data;
};

export const getAIRecommendations = async (classId) => {
  const response = await aiAPI.getRecommendations(classId);
  return response.data;
};

// Export
export const exportData = async (classId, format) => {
  const endpoint = format === 'csv' 
    ? exportAPI.classGradesCSV 
    : exportAPI.classGradesXLSX;
  const response = await endpoint(classId);
  return response.data;
};

export default api;

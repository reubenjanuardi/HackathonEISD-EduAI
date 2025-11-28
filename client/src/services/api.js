import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Dashboard API
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

// Grade Upload API
export const uploadGrades = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/grades/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const generateInsights = async (gradeData) => {
  const response = await api.post('/grades/insights', { gradeData });
  return response.data;
};

// Quiz API
export const startQuiz = async () => {
  const response = await api.get('/quiz/start');
  return response.data;
};

export const submitAnswer = async (quizId, questionId, answer) => {
  const response = await api.post('/quiz/answer', { quizId, questionId, answer });
  return response.data;
};

export const getQuizResult = async (quizId) => {
  const response = await api.get(`/quiz/result/${quizId}`);
  return response.data;
};

export default api;

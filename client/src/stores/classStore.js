import { create } from 'zustand';
import api from '../services/api';

export const useClassStore = create((set, get) => ({
  classes: [],
  currentClass: null,
  loading: false,
  error: null,

  // Fetch all classes for teacher
  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/classes?role=teacher');
      set({ classes: response.data.data || [], loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Fetch student's enrolled classes
  fetchStudentClasses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/classes?role=student');
      set({ classes: response.data.data || [], loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false, classes: [] });
      return { success: false, error: error.message };
    }
  },

  // Get class details
  fetchClassDetail: async (classId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/classes/${classId}`);
      set({ currentClass: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Create a new class (teacher only)
  createClass: async (classData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/classes', classData);
      const newClass = response.data.data;
      set((state) => ({
        classes: [...state.classes, newClass],
        loading: false,
      }));
      return { success: true, data: newClass };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Update a class
  updateClass: async (classId, classData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/classes/${classId}`, classData);
      const updatedClass = response.data.data;
      set((state) => ({
        classes: state.classes.map((c) =>
          c.id === classId ? updatedClass : c
        ),
        currentClass: state.currentClass?.id === classId ? updatedClass : state.currentClass,
        loading: false,
      }));
      return { success: true, data: updatedClass };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Delete a class
  deleteClass: async (classId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/classes/${classId}`);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== classId),
        currentClass: state.currentClass?.id === classId ? null : state.currentClass,
        loading: false,
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Enroll in a class by code (student)
  enrollByCode: async (code) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/classes/enroll-by-code', { code });
      const enrolledClass = response.data.data;
      set((state) => ({
        classes: [...state.classes, enrolledClass],
        loading: false,
      }));
      return { success: true, data: enrolledClass };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Enroll student (teacher action)
  enrollStudent: async (classId, studentId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/classes/${classId}/enroll`, { studentId });
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Unenroll student
  unenrollStudent: async (classId, studentId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/classes/${classId}/unenroll/${studentId}`);
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Set current class
  setCurrentClass: (classData) => set({ currentClass: classData }),

  // Clear state
  clearClasses: () => set({ classes: [], currentClass: null, error: null }),

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useClassStore;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './stores';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Teacher Pages
import { 
  TeacherDashboard,
  ClassManagement,
  ClassDetail,
  MaterialUpload,
  QuizBuilder,
  TeacherAnalytics 
} from './pages/teacher';

// Student Pages
import { 
  StudentDashboard,
  StudentClasses,
  StudentClassDetail,
  QuizTaker,
  QuizResult,
  StudentProgress 
} from './pages/student';

// Legacy pages (for backward compatibility during transition)
import Dashboard from './pages/Dashboard';
import UploadGrades from './pages/UploadGrades';
import Quiz from './pages/Quiz';
import LegacyQuizResult from './pages/QuizResult';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated, profile } = useAuthStore();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role if required
  const userRole = profile?.role || 'student';
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard
    return <Navigate to={userRole === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  
  return children;
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, profile, loading } = useAuthStore();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated()) {
    const role = profile?.role || 'student';
    return <Navigate to={role === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  
  return children;
};

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute requiredRole="teacher">
                <ClassManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:id"
            element={
              <ProtectedRoute requiredRole="teacher">
                <ClassDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/materials/:classId"
            element={
              <ProtectedRoute requiredRole="teacher">
                <MaterialUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quiz-builder/:classId"
            element={
              <ProtectedRoute requiredRole="teacher">
                <QuizBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics/:classId"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes/:id"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentClassDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/class/:classId/quiz/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizTaker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/class/:classId/quiz/:quizId/result"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentProgress />
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes (backward compatibility) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadGrades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/result/:id"
            element={
              <ProtectedRoute>
                <LegacyQuizResult />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

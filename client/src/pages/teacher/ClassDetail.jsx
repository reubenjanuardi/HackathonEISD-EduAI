import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore, useQuizStore } from '../../stores';
import { getMaterials, getClassAnalytics } from '../../services/api';

const ClassDetail = () => {
  const { id } = useParams();
  const { addToast } = useToast();
  const { currentClass, fetchClassDetail, enrollStudent, unenrollStudent, loading, error } = useClassStore();
  const { quizzes, fetchQuizzes } = useQuizStore();
  
  const [materials, setMaterials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchClassDetail(id);
      fetchQuizzes(id);
      loadMaterials();
      loadAnalytics();
    }
  }, [id, fetchClassDetail, fetchQuizzes]);

  const loadMaterials = async () => {
    try {
      const data = await getMaterials(id);
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getClassAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    // Note: This would need the student's user ID, for now we'll show the enrollment code
    addToast('Share the enrollment code with students to let them join', 'info');
    setShowEnrollModal(false);
  };

  const handleUnenroll = async (studentId) => {
    const success = await unenrollStudent(id, studentId);
    if (success) {
      addToast('Student removed from class', 'success');
    } else {
      addToast(error || 'Failed to remove student', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'materials', label: 'Materials' },
    { id: 'quizzes', label: 'Quizzes' }
  ];

  if (loading && !currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo="/teacher/classes" backLabel="Classes" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo="/teacher/classes" backLabel="Classes" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-neutral-400">Class not found</p>
            <Link to="/teacher/classes" className="text-primary hover:underline mt-2 inline-block">
              Back to Classes
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const enrollments = currentClass.enrollments || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar showBack backTo="/teacher/classes" backLabel="Classes" />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: currentClass.color || '#6366f1' }}
              >
                {currentClass.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{currentClass.name}</h1>
                <p className="text-neutral-400">{currentClass.subject}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <div className="bg-neutral-800 rounded-lg px-4 py-2">
                <span className="text-neutral-400 text-sm">Enrollment Code:</span>
                <span className="ml-2 font-mono text-primary font-bold">{currentClass.enrollment_code}</span>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="border-b border-neutral-700 mb-6">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? 'text-primary' 
                    : 'text-neutral-400 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                <p className="text-neutral-300">
                  {currentClass.description || 'No description provided'}
                </p>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-neutral-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{enrollments.length}</div>
                    <div className="text-sm text-neutral-400">Students</div>
                  </div>
                  <div className="text-center p-4 bg-neutral-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{materials.length}</div>
                    <div className="text-sm text-neutral-400">Materials</div>
                  </div>
                  <div className="text-center p-4 bg-neutral-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{quizzes.length}</div>
                    <div className="text-sm text-neutral-400">Quizzes</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <Link to={`/teacher/materials/${id}`} className="block">
                    <Button variant="secondary" className="w-full justify-start">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Materials
                    </Button>
                  </Link>
                  <Link to={`/teacher/quiz-builder/${id}`} className="block">
                    <Button variant="secondary" className="w-full justify-start">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Quiz
                    </Button>
                  </Link>
                  <Link to={`/teacher/analytics/${id}`} className="block">
                    <Button variant="secondary" className="w-full justify-start">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </Card>

              {analytics && (
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-400">Average Score</span>
                        <span className="text-white">{analytics.averageScore || 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${analytics.averageScore || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-400">Completion Rate</span>
                        <span className="text-white">{analytics.completionRate || 0}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${analytics.completionRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Enrolled Students</h3>
              <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
                Add Student
              </Button>
            </div>
            
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-neutral-400 mb-4">No students enrolled yet</p>
                <p className="text-sm text-neutral-500">
                  Share the enrollment code <span className="text-primary font-mono">{currentClass.enrollment_code}</span> with students
                </p>
              </div>
            ) : (
              <Table
                columns={[
                  { header: 'Name', accessor: 'name' },
                  { header: 'Email', accessor: 'email' },
                  { header: 'Enrolled', accessor: 'enrolled_at' },
                  { header: '', accessor: 'actions' }
                ]}
                data={enrollments.map((enrollment) => ({
                  name: enrollment.profiles?.name || 'Unknown',
                  email: enrollment.profiles?.email || '-',
                  enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString(),
                  actions: (
                    <button
                      className="text-red-400 hover:text-red-300 text-sm"
                      onClick={() => handleUnenroll(enrollment.student_id)}
                    >
                      Remove
                    </button>
                  )
                }))}
              />
            )}
          </Card>
        )}

        {activeTab === 'materials' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Course Materials</h3>
              <Link to={`/teacher/materials/${id}`}>
                <Button variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Material
                </Button>
              </Link>
            </div>
            
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-400">No materials uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <div key={material.id} className="p-4 bg-neutral-700/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{material.title}</h4>
                        <p className="text-neutral-400 text-sm">{material.file_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'quizzes' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Quizzes</h3>
              <Link to={`/teacher/quiz-builder/${id}`}>
                <Button variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Quiz
                </Button>
              </Link>
            </div>
            
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-neutral-400">No quizzes created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">{quiz.title}</h4>
                      <p className="text-neutral-400 text-sm">
                        {quiz.questions?.length || 0} questions • 
                        {quiz.is_published ? ' Published' : ' Draft'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        quiz.is_published 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Enroll Student Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title="Add Student"
        >
          <div className="space-y-4">
            <p className="text-neutral-300">
              Share the enrollment code with students so they can join the class:
            </p>
            <div className="p-4 bg-neutral-700 rounded-lg text-center">
              <p className="text-sm text-neutral-400 mb-2">Enrollment Code</p>
              <p className="text-3xl font-mono font-bold text-primary">{currentClass.enrollment_code}</p>
            </div>
            <p className="text-sm text-neutral-400">
              Students can enter this code in their dashboard to join the class.
            </p>
            <Button variant="secondary" className="w-full" onClick={() => setShowEnrollModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;

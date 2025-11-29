import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Navbar from '../../components/Navbar';
import { useClassStore, useQuizStore } from '../../stores';
import { getMaterials, summarizeMaterial } from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';

const StudentClassDetail = () => {
  const { id } = useParams();
  const { currentClass, fetchClassDetail, loading } = useClassStore();
  const { quizzes, fetchQuizzes } = useQuizStore();
  
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState('materials');

  useEffect(() => {
    if (id) {
      fetchClassDetail(id);
      fetchQuizzes(id);
      loadMaterials();
    }
  }, [id, fetchClassDetail, fetchQuizzes]);

  const loadMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const data = await getMaterials(id);
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleSummarize = async (material) => {
    setSelectedMaterial(material);
    setShowSummaryModal(true);
    setSummarizing(true);
    setSummary('');
    
    try {
      const result = await summarizeMaterial(material.id);
      setSummary(result.summary);
    } catch (err) {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const publishedQuizzes = quizzes.filter(q => q.is_published);

  const tabs = [
    { id: 'materials', label: 'Materials' },
    { id: 'quizzes', label: 'Quizzes' }
  ];

  if (loading && !currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo="/student/classes" backLabel="Classes" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Navbar showBack backTo="/student/classes" backLabel="Classes" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="text-center py-8">
            <p className="text-neutral-400">Class not found</p>
            <Link to="/student/classes" className="text-primary hover:underline mt-2 inline-block">
              Back to Classes
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar showBack backTo="/student/classes" backLabel="Classes" />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
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

          {currentClass.description && (
            <p className="text-neutral-400 mt-4 max-w-2xl mb-6">
              {currentClass.description}
            </p>
          )}

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
                {tab.id === 'quizzes' && publishedQuizzes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    {publishedQuizzes.length}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            {materialsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : materials.length === 0 ? (
              <Card className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-400">No materials available yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material) => (
                  <Card key={material.id} className="group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {material.title}
                        </h3>
                        <p className="text-neutral-400 text-sm">{material.file_type}</p>
                      </div>
                    </div>

                    {material.description && (
                      <p className="mt-4 text-neutral-400 text-sm line-clamp-2">
                        {material.description}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-neutral-700 flex gap-2">
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm text-center transition-colors"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleSummarize(material)}
                        className="flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
                      >
                        AI Summary
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div>
            {publishedQuizzes.length === 0 ? (
              <Card className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-neutral-400">No quizzes available yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {publishedQuizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{quiz.title}</h3>
                          {quiz.is_adaptive && (
                            <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                              Adaptive
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400 text-sm mb-2">
                          {quiz.description || 'No description'}
                        </p>
                        <div className="flex gap-4 text-sm text-neutral-500">
                          <span>{quiz.questions?.length || 0} questions</span>
                          <span>{quiz.time_limit} min</span>
                        </div>
                      </div>

                      <Link to={`/student/class/${id}/quiz/${quiz.id}`}>
                        <Button variant="primary">
                          Start Quiz
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Modal */}
        <Modal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          title={`AI Summary: ${selectedMaterial?.title}`}
        >
          <div className="space-y-4">
            {summarizing ? (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-neutral-400">Generating AI summary...</p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 whitespace-pre-wrap">{summary}</p>
              </div>
            )}
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setShowSummaryModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default StudentClassDetail;

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore } from '../../stores';
import { uploadMaterial, getMaterials, deleteMaterial, summarizeMaterial } from '../../services/api';

const MaterialUpload = () => {
  const { classId } = useParams();
  const { addToast } = useToast();
  const { currentClass, fetchClassDetail } = useClassStore();
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (classId) {
      fetchClassDetail(classId);
      loadMaterials();
    }
  }, [classId, fetchClassDetail]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getMaterials(classId);
      setMaterials(data);
    } catch (err) {
      addToast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        title: uploadData.title || file.name.replace(/\.[^/.]+$/, '')
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      addToast('Please select a file', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);

      await uploadMaterial(classId, formData);
      addToast('Material uploaded successfully!', 'success');
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMaterials();
    } catch (err) {
      addToast(err.message || 'Failed to upload material', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await deleteMaterial(materialId);
      addToast('Material deleted', 'success');
      loadMaterials();
    } catch (err) {
      addToast('Failed to delete material', 'error');
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

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (fileType?.includes('word') || fileType?.includes('doc')) {
      return (
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (fileType?.includes('image') || fileType?.includes('png') || fileType?.includes('jpg')) {
      return (
        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
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
              <h1 className="text-3xl font-bold text-white">Course Materials</h1>
              <p className="text-neutral-400">{currentClass?.name || 'Loading...'}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Material
              </Button>
            </div>
          </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : materials.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-neutral-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No materials yet</h3>
            <p className="text-neutral-400 mb-6">Upload course materials for your students</p>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              Upload Your First Material
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-neutral-700/50 rounded-lg">
                    {getFileIcon(material.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {material.title}
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      {material.file_type || 'Document'}
                    </p>
                  </div>
                </div>

                {material.description && (
                  <p className="mt-4 text-neutral-400 text-sm line-clamp-2">
                    {material.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 text-neutral-400 hover:text-primary hover:bg-neutral-700 rounded-lg transition-colors"
                        onClick={() => handleSummarize(material)}
                        title="AI Summary"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </button>
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-400 hover:text-green-400 hover:bg-neutral-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                      <button
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-lg transition-colors"
                        onClick={() => handleDelete(material.id)}
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Material"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                File
              </label>
              <div 
                className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadData.file ? (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white font-medium">{uploadData.file.name}</p>
                    <p className="text-sm text-neutral-400">
                      {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-neutral-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-neutral-400">Click to select a file</p>
                    <p className="text-xs text-neutral-500 mt-1">PDF, DOC, PPT, or images</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
            </div>

            <Input
              label="Title"
              placeholder="Material title"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description (optional)
              </label>
              <textarea
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Brief description of the material..."
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={uploading}
                disabled={!uploadData.file}
              >
                Upload
              </Button>
            </div>
          </form>
        </Modal>

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

export default MaterialUpload;

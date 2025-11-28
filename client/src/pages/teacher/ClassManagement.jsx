import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore } from '../../stores';

const ClassManagement = () => {
  const { classes, fetchClasses, createClass, deleteClass, loading, error } = useClassStore();
  const { addToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    color: '#6366f1'
  });

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await createClass(formData);
    if (result?.success) {
      addToast('Class created successfully!', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', subject: '', description: '', color: '#6366f1' });
      // Refresh the list
      fetchClasses();
    } else {
      addToast(result?.error || error || 'Failed to create class', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    const success = await deleteClass(selectedClass.id);
    if (success) {
      addToast('Class deleted successfully!', 'success');
      setShowDeleteModal(false);
      setSelectedClass(null);
    } else {
      addToast(error || 'Failed to delete class', 'error');
    }
  };

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar showBack backTo="/teacher/dashboard" backLabel="Dashboard" />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Class Management</h1>
              <p className="text-neutral-400">Create and manage your classes</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Class
              </Button>
            </div>
          </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-neutral-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No classes yet</h3>
            <p className="text-neutral-400 mb-6">Create your first class to start teaching</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Class
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="relative group">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ backgroundColor: cls.color || '#6366f1' }}
                  >
                    {cls.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/teacher/classes/${cls.id}`}>
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </Link>
                    <button 
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-700 rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedClass(cls);
                        setShowDeleteModal(true);
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <Link to={`/teacher/classes/${cls.id}`}>
                  <h3 className="text-xl font-semibold text-white mb-2 hover:text-primary transition-colors">
                    {cls.name}
                  </h3>
                </Link>
                
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-neutral-700 text-neutral-300 mb-3">
                  {cls.subject}
                </span>
                
                <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                  {cls.description || 'No description provided'}
                </p>

                <div className="pt-4 border-t border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-neutral-500">Enrollment Code:</span>
                      <span className="ml-2 font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {cls.enrollment_code}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link to={`/teacher/materials/${cls.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-sm">
                      Materials
                    </Button>
                  </Link>
                  <Link to={`/teacher/quiz-builder/${cls.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-sm">
                      Quizzes
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Class Modal */}
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          title="Create New Class"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Class Name"
              placeholder="e.g., Algebra 101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input
              label="Subject"
              placeholder="e.g., Mathematics"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Brief description of the class..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Class Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-transform ${
                      formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-800 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
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
                Create Class
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Class"
        >
          <div className="space-y-4">
            <p className="text-neutral-300">
              Are you sure you want to delete <span className="font-semibold text-white">{selectedClass?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={handleDelete}
                loading={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;

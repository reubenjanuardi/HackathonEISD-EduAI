import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/Toast';
import { useClassStore } from '../../stores';

const StudentClasses = () => {
  const { classes, fetchStudentClasses, enrollByCode, loading, error } = useClassStore();
  const { addToast } = useToast();
  
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchStudentClasses();
  }, [fetchStudentClasses]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    const success = await enrollByCode(enrollmentCode);
    if (success) {
      addToast('Successfully enrolled in class!', 'success');
      setShowEnrollModal(false);
      setEnrollmentCode('');
    } else {
      addToast(error || 'Failed to enroll. Check the code and try again.', 'error');
    }
    setEnrolling(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Classes</h1>
              <p className="text-neutral-400">View and manage your enrolled classes</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Join Class
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No classes yet</h3>
            <p className="text-neutral-400 mb-6">Get started by joining a class with an enrollment code from your teacher</p>
            <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
              Join Your First Class
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((enrollment) => {
              const cls = enrollment.classes;
              if (!cls) return null;
              return (
                <Link key={enrollment.id} to={`/student/classes/${cls.id}`}>
                  <Card className="hover:border-primary/50 transition-all duration-200 h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: cls.color || '#6366f1' }}
                      >
                        {cls.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{cls.name}</h3>
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-neutral-700 text-neutral-300">
                          {cls.subject}
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                      {cls.description || 'No description'}
                    </p>

                    <div className="pt-4 border-t border-neutral-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                        <span className="text-primary">View →</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Enroll Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title="Join a Class"
        >
          <form onSubmit={handleEnroll} className="space-y-4">
            <p className="text-neutral-400">
              Enter the enrollment code provided by your teacher to join a class.
            </p>
            <Input
              label="Enrollment Code"
              placeholder="e.g., ABC123"
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
              required
              className="font-mono text-center text-xl"
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowEnrollModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={enrolling}
              >
                Join Class
              </Button>
            </div>
          </form>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default StudentClasses;

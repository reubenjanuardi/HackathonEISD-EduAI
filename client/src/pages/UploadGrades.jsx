import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import { useToast } from '../components/Toast';
import { uploadGrades, generateInsights } from '../services/api';

const UploadGrades = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gradeData, setGradeData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      addToast('Please upload a CSV or Excel file', 'error');
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      const data = await uploadGrades(selectedFile);
      setGradeData(data.grades);
      addToast('File uploaded successfully!', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!gradeData) return;

    setGeneratingInsights(true);
    try {
      const data = await generateInsights(gradeData);
      setInsights(data.insights);
      addToast('AI insights generated!', 'success');
    } catch (error) {
      addToast('Failed to generate insights', 'error');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const tableColumns = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Grade', accessor: 'grade', render: (value) => <span className="font-semibold">{value}%</span> },
    { header: 'Status', accessor: 'grade', render: (value) => {
      const status = value >= 70 ? 'Pass' : 'Needs Improvement';
      const color = value >= 70 ? 'text-accent' : 'text-yellow-500';
      return <span className={color}>{status}</span>;
    }},
  ];

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Upload Student Grades</h1>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <Card className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/10' : 'border-neutral-600 hover:border-neutral-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-lg text-neutral-300">Uploading and processing...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg text-neutral-200 mb-2">
                      {file ? file.name : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm text-neutral-400">or</p>
                  </div>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInput}
                    />
                    <Button variant="primary" as="span">
                      Browse Files
                    </Button>
                  </label>
                  <p className="text-xs text-neutral-500">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Grade Data Preview */}
        {gradeData && (
          <Card title="Uploaded Grade Data" className="mb-8"
            headerAction={
              <Button
                variant="primary"
                onClick={handleGenerateInsights}
                loading={generatingInsights}
              >
                Generate AI Insights
              </Button>
            }
          >
            <Table columns={tableColumns} data={gradeData} />
          </Card>
        )}

        {/* AI Insights */}
        {insights && (
          <Card title="AI-Generated Insights" className="mb-8">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-4">
                {insights.split('\n').map((line, idx) => (
                  line.trim() && <p key={idx} className="text-neutral-200">{line}</p>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-accent">AI-Powered Analysis</p>
                  <p className="text-xs text-neutral-400 mt-1">These insights were generated using AI/ML API to help you make data-driven decisions.</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UploadGrades;

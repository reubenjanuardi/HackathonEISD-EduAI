import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import { BarChartComponent, PieChartComponent } from '../components/Chart';
import { getDashboardData } from '../services/api';
import { useToast } from '../components/Toast';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await getDashboardData();
      setData(dashboardData);
    } catch (error) {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Students',
      value: data?.stats?.totalStudents || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-primary',
    },
    {
      title: 'Average Grade',
      value: `${data?.stats?.averageGrade || 0}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-accent',
    },
    {
      title: 'Quiz Completion',
      value: `${data?.stats?.quizCompletion || 0}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-secondary',
    },
  ];

  const tableColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Grade', accessor: 'grade', render: (value) => <span className="font-semibold">{value}%</span> },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Date', accessor: 'date' },
  ];

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EduAI Dashboard</h1>
                <p className="text-sm text-neutral-400">Welcome back, Teacher!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/upload')}>
                Upload Grades
              </Button>
              <Button variant="primary" onClick={() => navigate('/quiz')}>
                Start Quiz
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, idx) => (
            <Card key={idx} className="hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card title="Grade Distribution">
            <BarChartComponent
              data={data?.gradeDistribution || []}
              dataKey="count"
              xKey="grade"
              color="#4F46E5"
            />
          </Card>

          <Card title="Subject Performance">
            <PieChartComponent
              data={data?.subjectPerformance || []}
              dataKey="value"
              nameKey="name"
            />
          </Card>
        </div>

        {/* Recent Students Table */}
        <Card title="Recent Student Grades" subtitle="Latest grade submissions">
          <Table
            columns={tableColumns}
            data={data?.recentStudents || []}
            emptyMessage="No student data available"
          />
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

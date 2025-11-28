import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';

const Navbar = ({ showBack = false, backTo, backLabel = 'Back', title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login');
  };

  const isTeacher = profile?.role === 'teacher';
  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/student/dashboard';

  const navLinks = isTeacher ? [
    { path: '/teacher/dashboard', label: 'Dashboard' },
    { path: '/teacher/classes', label: 'Classes' },
  ] : [
    { path: '/student/dashboard', label: 'Dashboard' },
    { path: '/student/classes', label: 'Classes' },
    { path: '/student/progress', label: 'Progress' },
  ];

  return (
    <nav className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {showBack && (
              <button
                onClick={() => backTo ? navigate(backTo) : navigate(-1)}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm hidden sm:inline">{backLabel}</span>
              </button>
            )}
            
            <Link to={dashboardPath} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg hidden sm:inline">EduAI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 ml-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path || location.pathname.startsWith(link.path + '/')
                      ? 'bg-primary/20 text-primary'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Page Title (Center) */}
          {title && (
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-white font-semibold">{title}</h1>
              {subtitle && <p className="text-neutral-400 text-sm text-center">{subtitle}</p>}
            </div>
          )}

          {/* Right Section - User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">{profile?.name || 'User'}</div>
                <div className="text-xs text-neutral-400 capitalize">{profile?.role || 'user'}</div>
              </div>
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-20 py-2">
                  <div className="px-4 py-3 border-b border-neutral-700">
                    <p className="text-sm font-medium text-white">{profile?.name}</p>
                    <p className="text-xs text-neutral-400">{profile?.email}</p>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="md:hidden py-2 border-b border-neutral-700">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setShowUserMenu(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          location.pathname === link.path
                            ? 'text-primary bg-primary/10'
                            : 'text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

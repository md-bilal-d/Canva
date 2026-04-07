import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 border-box w-full h-screen absolute inset-0 z-[100]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user && sessionStorage.getItem('isGuest') !== 'true') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

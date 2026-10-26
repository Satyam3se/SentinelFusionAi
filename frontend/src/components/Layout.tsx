import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { SyntheticBanner } from './SyntheticBanner';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  requireAuth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080F] flex items-center justify-center text-[#94a3b8] font-mono text-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-2 border-[#1e293b] border-t-[#FF9933] border-b-[#138808] rounded-full animate-spin" />
          <span className="text-white font-bold tracking-wider">INITIALIZING SENTINELFUSION CORE...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#f8fafc]">
      <SyntheticBanner />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-transparent tactical-grid-bg p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

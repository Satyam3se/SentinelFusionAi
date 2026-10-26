import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';

// 16 Full-Featured Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReviewCentrePage } from './pages/ReviewCentrePage';
import { SourceHealthPage } from './pages/SourceHealthPage';
import { OfflineResiliencePage } from './pages/OfflineResiliencePage';
import { SituationReportsPage } from './pages/SituationReportsPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SecurityCentrePage } from './pages/SecurityCentrePage';
import { UserAdminPage } from './pages/UserAdminPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { TacticalMapPage } from './pages/TacticalMapPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Command Console Routes */}
          <Route element={<Layout requireAuth={true} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tactical-map" element={<TacticalMapPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/review" element={<ReviewCentrePage />} />
            <Route path="/source-health" element={<SourceHealthPage />} />
            <Route path="/resilience" element={<OfflineResiliencePage />} />
            <Route path="/situation-reports" element={<SituationReportsPage />} />
            <Route path="/simulation" element={<SimulationLabPage />} />
            <Route path="/audit" element={<AuditTrailPage />} />
            <Route path="/security" element={<SecurityCentrePage />} />
            <Route path="/admin/users" element={<UserAdminPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

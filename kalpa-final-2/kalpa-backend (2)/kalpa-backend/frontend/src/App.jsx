import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ViewerRoute from './components/ViewerRoute';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import ProductPage from './pages/ProductPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ScannerPage from './pages/ScannerPage';
import SearchPage from './pages/SearchPage';
import ViewerHomePage from './pages/ViewerHomePage';
import { useAuthStore } from './store/authStore';

function RoleRedirect() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/app'} replace />;
}

function ComingSoon({ title }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)' }}>This module is under construction.</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ── Unprotected ── */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/landing"          element={<LandingPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />

          {/* ── Role-based root redirect ── */}
          <Route path="/" element={<RoleRedirect />} />

          {/* ── Shared: product detail (role-aware nav auto-switches in Layout) ── */}
          <Route path="/product/:id" element={<Layout><ProtectedRoute><ProductPage /></ProtectedRoute></Layout>} />

          {/* ── Viewer portal ── */}
          <Route path="/app"                  element={<Layout><ViewerRoute><ViewerHomePage /></ViewerRoute></Layout>} />
          <Route path="/app/search"           element={<Layout><ViewerRoute><SearchPage /></ViewerRoute></Layout>} />
          <Route path="/app/scanner"          element={<Layout><ViewerRoute><ScannerPage /></ViewerRoute></Layout>} />
          <Route path="/app/notifications"    element={<Layout><ViewerRoute><NotificationsPage /></ViewerRoute></Layout>} />
          <Route path="/app/profile"          element={<Layout><ViewerRoute><ProfilePage /></ViewerRoute></Layout>} />

          {/* ── Admin portal ── */}
          <Route path="/admin"                element={<Layout><AdminRoute><AnalyticsPage /></AdminRoute></Layout>} />
          <Route path="/admin/assets"         element={<Layout><AdminRoute><SearchPage /></AdminRoute></Layout>} />
          <Route path="/admin/scanner"        element={<Layout><AdminRoute><ScannerPage /></AdminRoute></Layout>} />
          <Route path="/admin/manage"         element={<Layout><AdminRoute><AdminPage /></AdminRoute></Layout>} />
          <Route path="/admin/users"          element={<Layout><AdminRoute><ComingSoon title="User Management" /></AdminRoute></Layout>} />
          <Route path="/admin/audit"          element={<Layout><AdminRoute><ComingSoon title="Audit Logs" /></AdminRoute></Layout>} />
          <Route path="/admin/settings"       element={<Layout><AdminRoute><ComingSoon title="Settings" /></AdminRoute></Layout>} />

          {/* ── Backward-compat redirects ── */}
          <Route path="/analytics" element={<Navigate to="/admin" replace />} />
          <Route path="/scanner"   element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import './css/style.css';
import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import DeviceDashboard from './pages/DeviceDashboard';
import WelcomingPage from './pages/WelcomingPage';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HiveManagement from './pages/HiveManagement';

// Import auth components
import { AuthProvider } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import BeekeeperRoute from './components/BeekeeperRoute';

function App() {
  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]);

  return (
    <AuthProvider>
      <Routes>
        <Route exact path="/" element={<WelcomingPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Beekeeper ve Admin için korumalı route'lar */}
        <Route path="/dashboard" element={
          <BeekeeperRoute>
            <Dashboard />
          </BeekeeperRoute>
        } />
        <Route path="/device-dashboard" element={
          <BeekeeperRoute>
            <DeviceDashboard />
          </BeekeeperRoute>
        } />
        <Route path="/profile" element={
          <BeekeeperRoute>
            <UserProfile />
          </BeekeeperRoute>
        } />
        <Route path="/hives" element={
          <BeekeeperRoute>
            <HiveManagement />
          </BeekeeperRoute>
        } />

        {/* Sadece Admin için */}
        <Route path="/admin-panel" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
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
import WelcomingPage from './pages/WelcomingPage';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HiveManagement from './pages/HiveManagement';

// Import auth components
import { AuthProvider } from './contexts/AuthContext';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <AuthProvider>
      <Routes>
        <Route exact path="/" element={<WelcomingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/hives" element={<HiveManagement />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

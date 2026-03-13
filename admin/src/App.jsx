import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Comments from './pages/Comments';
import ProfilePage from './pages/ProfilePage';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Media from './pages/Media';
import Logs from './pages/Logs';
import Settings from './pages/Settings'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function AppContent() {
  const { user } = useAuth();
  const isAuthenticated = user && ['admin', 'superadmin'].includes(user.role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div>
      {isAuthenticated && (
        <div style={{ marginLeft: sidebarCollapsed ? '70px' : '260px', transition: 'margin-left 0.3s ease' }}>
          <Navbar />
        </div>
      )}
      <div style={{ display: 'flex', minHeight: isAuthenticated ? 'calc(100vh - 56px)' : '100vh' }}>
        {isAuthenticated && <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />}
        <div
          className="main-content"
          style={{
            flex: 1,
            padding: '2rem',
            marginLeft: isAuthenticated ? (sidebarCollapsed ? '70px' : '260px') : 0,
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
            <Route path="/comments" element={<PrivateRoute><Comments /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/media" element={<PrivateRoute><Media /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <ToastContainer />
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
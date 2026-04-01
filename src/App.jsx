import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Materials from './pages/Materials';
import Announcements from './pages/Announcements';
import Schedules from './pages/Schedules';
import Assignments from './pages/Assignments';
import Scores from './pages/Scores';

// Protected Route Wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

      {/* Protected Routes inside Sidebar Layout */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
      <Route path="/materials" element={<PrivateRoute><Materials /></PrivateRoute>} />
      <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
      <Route path="/schedules" element={<PrivateRoute><Schedules /></PrivateRoute>} />
      <Route path="/assignments" element={<PrivateRoute><Assignments /></PrivateRoute>} />
      <Route path="/scores" element={<PrivateRoute><Scores /></PrivateRoute>} />

      {/* Redirect root to dashboard */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

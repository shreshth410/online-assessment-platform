import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PendingApproval from './pages/auth/PendingApproval';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Instructor pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import QuestionManagement from './pages/instructor/QuestionManagement';
import TestCreation from './pages/instructor/TestCreation';
import TestList from './pages/instructor/TestList';
import TestResults from './pages/instructor/TestResults';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableTests from './pages/student/AvailableTests';
import TestAttempt from './pages/student/TestAttempt';
import ResultPage from './pages/student/ResultPage';
import StudentResults from './pages/student/StudentResults';

import './index.css';

/**
 * ProtectedRoute — Redirects to login if not authenticated,
 * shows pending approval if not approved, restricts by role.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, isApproved, role } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !isApproved) {
    return <PendingApproval />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard
    const dashboardRoutes = {
      admin: '/admin',
      instructor: '/instructor',
      student: '/student',
    };
    return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
  }

  return children;
}

/**
 * PublicRoute — Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { user, profile, loading, isApproved, role } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (user && profile && isApproved) {
    const dashboardRoutes = {
      admin: '/admin',
      instructor: '/instructor',
      student: '/student',
    };
    return <Navigate to={dashboardRoutes[role] || '/'} replace />;
  }

  return children;
}

/**
 * HomeRedirect — Redirects / to the correct dashboard based on role
 */
function HomeRedirect() {
  const { user, profile, loading, isApproved, role } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile && !isApproved) return <PendingApproval />;

  const dashboardRoutes = {
    admin: '/admin',
    instructor: '/instructor',
    student: '/student',
  };

  return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Home redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Auth routes */}
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/subjects" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<QuestionManagement />} />
            <Route path="/admin/tests" element={<TestList />} />
            <Route path="/admin/results" element={<TestResults />} />
          </Route>

          {/* Instructor routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/questions" element={<QuestionManagement />} />
            <Route path="/instructor/tests/create" element={<TestCreation />} />
            <Route path="/instructor/tests" element={<TestList />} />
            <Route path="/instructor/results" element={<TestResults />} />
          </Route>

          {/* Student routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/tests" element={<AvailableTests />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/result/:attemptId" element={<ResultPage />} />
          </Route>

          {/* Test attempt (full screen, no sidebar) */}
          <Route path="/student/test/:testId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <TestAttempt />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

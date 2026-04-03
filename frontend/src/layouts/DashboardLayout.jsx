import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import './DashboardLayout.css';

/**
 * DashboardLayout — Sidebar + topbar layout for authenticated users.
 * Navigation links are role-aware.
 */

const NAV_ITEMS = {
  admin: [
    { to: '/admin', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: HiOutlineUsers, label: 'Manage Users' },
    { to: '/admin/subjects', icon: HiOutlineAcademicCap, label: 'Subjects' },
    { to: '/admin/questions', icon: HiOutlineDocumentText, label: 'Questions' },
    { to: '/admin/tests', icon: HiOutlineClipboardList, label: 'Tests' },
    { to: '/admin/results', icon: HiOutlineChartBar, label: 'Results' },
  ],
  instructor: [
    { to: '/instructor', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/instructor/questions', icon: HiOutlineDocumentText, label: 'Questions' },
    { to: '/instructor/tests/create', icon: HiOutlinePlusCircle, label: 'Create Test' },
    { to: '/instructor/tests', icon: HiOutlineClipboardList, label: 'My Tests', end: true },
    { to: '/instructor/results', icon: HiOutlineChartBar, label: 'Results' },
  ],
  student: [
    { to: '/student', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/student/tests', icon: HiOutlineClipboardList, label: 'Available Tests' },
    { to: '/student/results', icon: HiOutlineChartBar, label: 'My Results' },
  ],
};

export default function DashboardLayout() {
  const { profile, signOut, role } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_ITEMS[role] || [];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#sidebarLogoGrad)" />
              <path d="M12 26V14l8 6-8 6zm8-6l8-6v12l-8-6z" fill="white" opacity="0.9" />
              <defs>
                <linearGradient id="sidebarLogoGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="sidebar-brand-text">AssessHub</span>
          </div>
          <button
            className="btn btn-ghost sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile?.name}</span>
              <span className="sidebar-user-role badge badge-primary">
                {profile?.role}
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost sidebar-logout"
            onClick={handleSignOut}
            title="Sign out"
          >
            <HiOutlineLogout size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top bar (mobile) */}
        <header className="topbar">
          <button
            className="btn btn-ghost topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineMenu size={22} />
          </button>
          <span className="topbar-title">
            {navItems.find(i => window.location.pathname === i.to)?.label || 'Dashboard'}
          </span>
          <div className="topbar-right">
            <div className="topbar-user-avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

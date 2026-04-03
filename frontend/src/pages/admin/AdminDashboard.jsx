import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * AdminDashboard — Overview stats, pending approvals, and user management
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [usersRes, testsRes, questionsRes, attemptsRes, subjectsRes, pendingRes] = await Promise.all([
        supabase.from('users').select('id, role, status', { count: 'exact' }),
        supabase.from('tests').select('id', { count: 'exact' }),
        supabase.from('questions').select('id', { count: 'exact' }),
        supabase.from('attempts').select('id, score, status').eq('status', 'completed'),
        supabase.from('subjects').select('id', { count: 'exact' }),
        supabase.from('users').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const totalStudents = usersRes.data?.filter(u => u.role === 'student').length || 0;
      const totalTests = testsRes.data?.length || 0;
      const totalQuestions = questionsRes.data?.length || 0;
      const completedAttempts = attemptsRes.data || [];
      const avgScore = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length)
        : 0;
      const totalSubjects = subjectsRes.data?.length || 0;

      setStats({
        totalUsers,
        totalStudents,
        totalTests,
        totalQuestions,
        totalSubjects,
        totalAttempts: completedAttempts.length,
        avgScore,
        pendingCount: pendingRes.data?.length || 0,
      });

      setPendingUsers(pendingRes.data || []);

      // Recent users
      const { data: recent } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentUsers(recent || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User approved!');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User rejected');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to reject user');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: HiOutlineUsers, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Total Tests', value: stats?.totalTests, icon: HiOutlineClipboardList, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Questions', value: stats?.totalQuestions, icon: HiOutlineAcademicCap, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Attempts', value: stats?.totalAttempts, icon: HiOutlineChartBar, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Subjects', value: stats?.totalSubjects, icon: HiOutlineAcademicCap, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { label: 'Pending', value: stats?.pendingCount, icon: HiOutlineClock, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of platform activity and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-stats stagger-children" style={{ marginBottom: 'var(--space-2xl)' }}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={24} />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            <HiOutlineClock style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-warning)' }} />
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className="badge badge-primary">{user.role}</span></td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(user.id)}
                          title="Approve"
                        >
                          <HiOutlineCheck size={16} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(user.id)}
                          title="Reject"
                        >
                          <HiOutlineX size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
          Recent Users
        </h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td><span className="badge badge-primary">{user.role}</span></td>
                  <td>
                    <span className={`badge ${
                      user.status === 'approved' ? 'badge-success' :
                      user.status === 'rejected' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineUsers,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * InstructorDashboard — Instructor overview with stats and quick actions
 */
export default function InstructorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({});
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, questionsRes] = await Promise.all([
        supabase.from('tests').select('*, test_questions(id), attempts(id, status)').eq('created_by', profile.id),
        supabase.from('questions').select('id').eq('created_by', profile.id),
      ]);

      const tests = testsRes.data || [];
      const totalQuestions = questionsRes.data?.length || 0;
      const totalAttempts = tests.reduce((sum, t) =>
        sum + (t.attempts?.filter(a => a.status === 'completed').length || 0), 0);

      setStats({
        totalTests: tests.length,
        publishedTests: tests.filter(t => t.is_published).length,
        totalQuestions,
        totalAttempts,
      });

      setRecentTests(tests.slice(0, 5));
    } catch (err) {
      toast.error('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  const statCards = [
    { label: 'My Tests', value: stats.totalTests, icon: HiOutlineClipboardList, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Published', value: stats.publishedTests, icon: HiOutlineClipboardList, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Questions Created', value: stats.totalQuestions, icon: HiOutlineDocumentText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Student Attempts', value: stats.totalAttempts, icon: HiOutlineUsers, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Instructor Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.name}</p>
        </div>
        <Link to="/instructor/tests/create" className="btn btn-primary">
          + Create Test
        </Link>
      </div>

      <div className="grid-stats stagger-children" style={{ marginBottom: 'var(--space-2xl)' }}>
        {statCards.map(card => (
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

      {/* Recent Tests */}
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        Recent Tests
      </h2>
      {recentTests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No tests yet</div>
          <p className="empty-state-text">Create your first test to get started.</p>
          <Link to="/instructor/tests/create" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
            Create Test
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Questions</th>
                <th>Attempts</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.map(test => (
                <tr key={test.id}>
                  <td style={{ fontWeight: 600 }}>{test.title}</td>
                  <td>{test.test_questions?.length || 0}</td>
                  <td>{test.attempts?.filter(a => a.status === 'completed').length || 0}</td>
                  <td>
                    <span className={`badge ${test.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {test.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(test.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

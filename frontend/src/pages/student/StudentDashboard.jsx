import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineClock,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * StudentDashboard — Overview for students: available tests, completed tests, performance stats.
 */
export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({});
  const [availableTests, setAvailableTests] = useState([]);
  const [completedAttempts, setCompletedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get completed attempts
      const { data: attempts } = await supabase
        .from('attempts')
        .select('*, tests(title, subjects(name)), results(*)')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

      setCompletedAttempts(attempts || []);

      // Get attempted test IDs
      const { data: allAttempts } = await supabase
        .from('attempts')
        .select('test_id')
        .eq('user_id', profile.id);

      const attemptedTestIds = [...new Set((allAttempts || []).map(a => a.test_id))];

      // Get available tests (published, not attempted)
      let query = supabase
        .from('tests')
        .select('*, subjects(name), test_questions(id)')
        .eq('is_published', true);

      if (attemptedTestIds.length > 0) {
        query = query.not('id', 'in', `(${attemptedTestIds.join(',')})`);
      }

      const { data: tests } = await query.order('created_at', { ascending: false });
      setAvailableTests((tests || []).filter(t => t.test_questions?.length > 0));

      // Stats
      const completed = attempts || [];
      const avgScore = completed.length > 0
        ? (completed.reduce((s, a) => s + (a.results?.[0]?.percentage || 0), 0) / completed.length).toFixed(1)
        : 0;

      setStats({
        testsCompleted: completed.length,
        averageScore: avgScore,
        bestScore: completed.length > 0 ? Math.max(...completed.map(a => a.results?.[0]?.percentage || 0)) : 0,
        availableCount: (tests || []).filter(t => t.test_questions?.length > 0).length,
      });
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
    { label: 'Available Tests', value: stats.availableCount, icon: HiOutlineClipboardList, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Completed', value: stats.testsCompleted, icon: HiOutlineCheck, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Average Score', value: `${stats.averageScore}%`, icon: HiOutlineChartBar, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: HiOutlineChartBar, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.name}</p>
        </div>
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

      {/* Available Tests */}
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        <HiOutlineClock style={{ verticalAlign: 'middle', marginRight: '8px' }} />
        Available Tests
      </h2>
      {availableTests.length === 0 ? (
        <div className="card" style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No tests available at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="grid-cards stagger-children" style={{ marginBottom: 'var(--space-2xl)' }}>
          {availableTests.map(test => (
            <div key={test.id} className="card card-hover">
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                {test.title}
              </h3>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span>📚 {test.subjects?.name}</span>
                <span>⏱ {test.duration} min</span>
                <span>❓ {test.test_questions?.length} questions</span>
              </div>
              <Link to={`/student/test/${test.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                Start Test
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tests */}
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
        <HiOutlineCheck style={{ verticalAlign: 'middle', marginRight: '8px' }} />
        Completed Tests
      </h2>
      {completedAttempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>You haven't completed any tests yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {completedAttempts.map(a => {
                const result = a.results?.[0];
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.tests?.title}</td>
                    <td>{a.tests?.subjects?.name}</td>
                    <td>{result?.correct_answers || 0}/{result?.total_questions || 0}</td>
                    <td>
                      <span className={`badge ${
                        (result?.percentage || 0) >= 70 ? 'badge-success' :
                        (result?.percentage || 0) >= 40 ? 'badge-warning' : 'badge-error'
                      }`}>
                        {result?.percentage || 0}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {a.end_time ? new Date(a.end_time).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link to={`/student/result/${a.id}`} className="btn btn-ghost btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

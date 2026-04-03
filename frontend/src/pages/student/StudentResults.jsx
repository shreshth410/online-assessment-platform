import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * StudentResults — View all completed test results
 */
export default function StudentResults() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data } = await supabase
        .from('attempts')
        .select('*, tests(title, subjects(name)), results(*)')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

      setAttempts(data || []);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Results</h1>
          <p className="page-subtitle">{attempts.length} completed test{attempts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No results yet</div>
          <p className="empty-state-text">Complete a test to see your results here.</p>
          <Link to="/student/tests" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Subject</th>
                <th>Correct</th>
                <th>Total</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(a => {
                const result = a.results?.[0];
                const pct = result?.percentage || 0;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.tests?.title}</td>
                    <td>{a.tests?.subjects?.name}</td>
                    <td style={{ color: 'var(--color-success)' }}>{result?.correct_answers || 0}</td>
                    <td>{result?.total_questions || 0}</td>
                    <td>
                      <span className={`badge ${pct >= 70 ? 'badge-success' : pct >= 40 ? 'badge-warning' : 'badge-error'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${pct >= 40 ? 'badge-success' : 'badge-error'}`}>
                        {pct >= 40 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {a.end_time ? new Date(a.end_time).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link to={`/student/result/${a.id}`} className="btn btn-ghost btn-sm">
                        View
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

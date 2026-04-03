import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * TestResults — View results for a specific test or all tests.
 * Shows student scores, percentages, and aggregate stats.
 */
export default function TestResults() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('test');

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(testId || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) fetchResults();
  }, [selectedTest]);

  const fetchTests = async () => {
    const { data } = await supabase
      .from('tests')
      .select('id, title')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false });
    setTests(data || []);
    setLoading(false);
  };

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*, users(name, email), results(*)')
        .eq('test_id', selectedTest)
        .eq('status', 'completed')
        .order('score', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      toast.error('Failed to load results');
    }
  };

  const avgPercentage = results.length > 0
    ? (results.reduce((s, r) => s + (r.results?.[0]?.percentage || 0), 0) / results.length).toFixed(1)
    : 0;
  const maxScore = results.length > 0
    ? Math.max(...results.map(r => r.results?.[0]?.percentage || 0))
    : 0;
  const minScore = results.length > 0
    ? Math.min(...results.map(r => r.results?.[0]?.percentage || 0))
    : 0;

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Test Results</h1>
          <p className="page-subtitle">View student performance on your tests</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <select className="input" style={{ maxWidth: '400px' }} value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
          <option value="">Select a test</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {selectedTest && results.length > 0 && (
        <>
          {/* Aggregate Stats */}
          <div className="grid-stats" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-label">Total Students</div>
                <div className="stat-card-value">{results.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-label">Average Score</div>
                <div className="stat-card-value">{avgPercentage}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-label">Highest Score</div>
                <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>{maxScore}%</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-label">Lowest Score</div>
                <div className="stat-card-value" style={{ color: 'var(--color-error)' }}>{minScore}%</div>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Correct</th>
                  <th>Total</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const result = r.results?.[0];
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: i < 3 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                        #{i + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.users?.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{r.users?.email}</td>
                      <td>{result?.correct_answers || 0}</td>
                      <td>{result?.total_questions || 0}</td>
                      <td>{result?.score || 0}</td>
                      <td>
                        <span className={`badge ${
                          (result?.percentage || 0) >= 70 ? 'badge-success' :
                          (result?.percentage || 0) >= 40 ? 'badge-warning' : 'badge-error'
                        }`}>
                          {result?.percentage || 0}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {r.end_time ? new Date(r.end_time).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedTest && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No results yet</div>
          <p className="empty-state-text">No students have completed this test yet.</p>
        </div>
      )}
    </div>
  );
}

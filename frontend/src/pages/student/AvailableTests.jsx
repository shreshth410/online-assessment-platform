import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * AvailableTests — Browse and start published tests
 */
export default function AvailableTests() {
  const { profile } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data: attempts } = await supabase
        .from('attempts')
        .select('test_id')
        .eq('user_id', profile.id);

      const attemptedIds = [...new Set((attempts || []).map(a => a.test_id))];

      let query = supabase
        .from('tests')
        .select('*, subjects(name), test_questions(id), users!tests_created_by_fkey(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (attemptedIds.length > 0) {
        query = query.not('id', 'in', `(${attemptedIds.join(',')})`);
      }

      const { data } = await query;
      setTests((data || []).filter(t => t.test_questions?.length > 0));
    } catch (err) {
      toast.error('Failed to load tests');
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
          <h1 className="page-title">Available Tests</h1>
          <p className="page-subtitle">{tests.length} test{tests.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tests available</div>
          <p className="empty-state-text">Check back later for new tests.</p>
        </div>
      ) : (
        <div className="grid-cards stagger-children">
          {tests.map(test => (
            <div key={test.id} className="card card-hover">
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                {test.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span>📚 Subject: {test.subjects?.name}</span>
                <span>⏱ Duration: {test.duration} minutes</span>
                <span>❓ Questions: {test.test_questions?.length}</span>
                <span>👤 By: {test.users?.name || 'Instructor'}</span>
              </div>
              <Link to={`/student/test/${test.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                Start Test
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

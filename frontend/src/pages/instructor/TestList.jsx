import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { HiOutlineEye, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * TestList — Shows all tests created by the instructor
 */
export default function TestList() {
  const { profile } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, subjects(name), test_questions(id), attempts(id, status)')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (testId, current) => {
    try {
      const { error } = await supabase
        .from('tests')
        .update({ is_published: !current })
        .eq('id', testId);
      if (error) throw error;
      toast.success(!current ? 'Test published!' : 'Test unpublished');
      fetchTests();
    } catch (err) {
      toast.error('Failed to update test');
    }
  };

  const handleDelete = async (testId) => {
    if (!confirm('Delete this test? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('tests').delete().eq('id', testId);
      if (error) throw error;
      toast.success('Test deleted');
      fetchTests();
    } catch (err) {
      toast.error(err.message || 'Failed to delete test');
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tests</h1>
          <p className="page-subtitle">{tests.length} tests created</p>
        </div>
        <Link to="/instructor/tests/create" className="btn btn-primary">+ Create Test</Link>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tests yet</div>
          <p className="empty-state-text">Create your first test to get started.</p>
        </div>
      ) : (
        <div className="grid-cards stagger-children">
          {tests.map(test => (
            <div key={test.id} className="card card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{test.title}</h3>
                <span className={`badge ${test.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {test.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span>📚 {test.subjects?.name}</span>
                <span>⏱ {test.duration} min</span>
                <span>❓ {test.test_questions?.length || 0} questions</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                {test.attempts?.filter(a => a.status === 'completed').length || 0} attempts completed
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => togglePublish(test.id, test.is_published)}>
                  {test.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <Link to={`/instructor/results?test=${test.id}`} className="btn btn-sm btn-ghost">
                  <HiOutlineEye size={16} /> Results
                </Link>
                <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(test.id)} style={{ color: 'var(--color-error)' }}>
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

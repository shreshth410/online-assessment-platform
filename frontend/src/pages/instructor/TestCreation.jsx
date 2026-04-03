import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * TestCreation — Form for creating tests with a question picker.
 */
export default function TestCreation() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Question filter
  const [qFilter, setQFilter] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjectId) fetchQuestions();
  }, [subjectId]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('subject_id', subjectId)
      .order('difficulty');
    setQuestions(data || []);
  };

  const toggleQuestion = (qId) => {
    setSelectedQuestions(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    if (!title.trim() || !subjectId || !duration) {
      toast.error('Please fill in all fields');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setSaving(true);

    try {
      // Create test
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          title: title.trim(),
          subject_id: parseInt(subjectId),
          duration: parseInt(duration),
          created_by: profile.id,
          is_published: publish,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Add questions to test
      const testQuestions = selectedQuestions.map(qId => ({
        test_id: test.id,
        question_id: qId,
      }));

      const { error: tqError } = await supabase
        .from('test_questions')
        .insert(testQuestions);

      if (tqError) throw tqError;

      toast.success(`Test ${publish ? 'published' : 'saved as draft'}!`);
      navigate('/instructor/tests');
    } catch (err) {
      toast.error(err.message || 'Failed to create test');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(qFilter.toLowerCase())
  );

  const difficultyColor = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-error' };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Test</h1>
          <p className="page-subtitle">Design an assessment for your students</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)' }}>
          {/* Left: Test Details */}
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
                Test Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Test Title *</label>
                  <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., DBMS Mid-Term Assessment" required />
                </div>
                <div className="input-group">
                  <label>Subject *</label>
                  <select className="input" value={subjectId} onChange={e => { setSubjectId(e.target.value); setSelectedQuestions([]); }} required>
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Duration (minutes) *</label>
                  <input className="input" type="number" min="5" max="180" value={duration} onChange={e => setDuration(e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Selected Questions Summary */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                Selected Questions ({selectedQuestions.length})
              </h3>
              {selectedQuestions.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Select questions from the list on the right
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {selectedQuestions.map(qId => {
                    const q = questions.find(q => q.id === qId);
                    return q ? (
                      <div key={qId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-sm)', background: 'var(--color-accent-light)',
                        borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {q.question_text}
                        </span>
                        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => toggleQuestion(qId)}>
                          <HiOutlineX size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                <button type="submit" className="btn btn-secondary" disabled={saving}>
                  Save Draft
                </button>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={(e) => handleSubmit(e, true)}>
                  {saving ? <span className="spinner spinner-sm" /> : <HiOutlineCheck size={18} />}
                  Publish Test
                </button>
              </div>
            </div>
          </div>

          {/* Right: Question Picker */}
          <div>
            <div className="card" style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                Available Questions
              </h3>
              {!subjectId ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Select a subject first to see available questions
                </p>
              ) : (
                <>
                  <input
                    className="input"
                    placeholder="Search questions..."
                    value={qFilter}
                    onChange={e => setQFilter(e.target.value)}
                    style={{ marginBottom: 'var(--space-md)' }}
                  />
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {filteredQuestions.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--space-xl)' }}>
                        No questions found for this subject
                      </p>
                    ) : (
                      filteredQuestions.map(q => (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestion(q.id)}
                          style={{
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${selectedQuestions.includes(q.id) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            background: selectedQuestions.includes(q.id) ? 'var(--color-accent-light)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span className={`badge ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>
                            {selectedQuestions.includes(q.id) && <HiOutlineCheck size={18} style={{ color: 'var(--color-accent)' }} />}
                          </div>
                          <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>{q.question_text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

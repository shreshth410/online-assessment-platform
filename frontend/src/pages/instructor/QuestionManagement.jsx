import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * QuestionManagement — CRUD interface for managing questions.
 * Instructors/admins can create, edit, and delete questions with subject & difficulty filters.
 */
export default function QuestionManagement() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Form state
  const [form, setForm] = useState({
    subject_id: '',
    difficulty: 'medium',
    question_text: '',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  });

  useEffect(() => {
    fetchData();
  }, [filterSubject, filterDifficulty]);

  const fetchData = async () => {
    try {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      setSubjects(subjectsData || []);

      let query = supabase
        .from('questions')
        .select('*, subjects(name), options(*)')
        .order('created_at', { ascending: false });

      if (filterSubject) query = query.eq('subject_id', filterSubject);
      if (filterDifficulty) query = query.eq('difficulty', filterDifficulty);

      const { data: questionsData, error } = await query;
      if (error) throw error;
      setQuestions(questionsData || []);
    } catch (err) {
      toast.error('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      subject_id: '',
      difficulty: 'medium',
      question_text: '',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (question) => {
    setForm({
      subject_id: question.subject_id,
      difficulty: question.difficulty,
      question_text: question.question_text,
      options: question.options.map(o => ({
        id: o.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
      })),
    });
    setEditingId(question.id);
    setShowForm(true);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...form.options];
    if (field === 'is_correct') {
      newOptions.forEach((o, i) => (o.is_correct = i === index));
    } else {
      newOptions[index][field] = value;
    }
    setForm({ ...form, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject_id || !form.question_text.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.options.some(o => !o.option_text.trim())) {
      toast.error('All options must have text');
      return;
    }

    try {
      if (editingId) {
        // Update question
        const { error: qError } = await supabase
          .from('questions')
          .update({
            subject_id: parseInt(form.subject_id),
            difficulty: form.difficulty,
            question_text: form.question_text,
          })
          .eq('id', editingId);

        if (qError) throw qError;

        // Update options
        for (const option of form.options) {
          if (option.id) {
            await supabase
              .from('options')
              .update({ option_text: option.option_text, is_correct: option.is_correct })
              .eq('id', option.id);
          }
        }

        toast.success('Question updated!');
      } else {
        // Insert question
        const { data: newQ, error: qError } = await supabase
          .from('questions')
          .insert({
            subject_id: parseInt(form.subject_id),
            difficulty: form.difficulty,
            question_text: form.question_text,
            created_by: profile.id,
          })
          .select()
          .single();

        if (qError) throw qError;

        // Insert options
        const optionsToInsert = form.options.map(o => ({
          question_id: newQ.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
        }));

        const { error: oError } = await supabase
          .from('options')
          .insert(optionsToInsert);

        if (oError) throw oError;
        toast.success('Question created!');
      }

      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save question');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Question deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Cannot delete — question may be used in a test');
    }
  };

  const difficultyColor = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-error',
  };

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="page-subtitle">{questions.length} questions total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <HiOutlinePlus size={18} /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: '200px' }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: '200px' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Question' : 'New Question'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={resetForm}><HiOutlineX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="input-group">
                    <label>Subject *</label>
                    <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} required>
                      <option value="">Select subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Difficulty *</label>
                    <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} required>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Question Text *</label>
                  <textarea className="input" value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} placeholder="Enter the question..." required />
                </div>

                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Options * (select the correct answer)
                  </label>
                  {form.options.map((option, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                      <input
                        type="radio"
                        name="correct_option"
                        checked={option.is_correct}
                        onChange={() => handleOptionChange(i, 'is_correct', true)}
                        style={{ accentColor: 'var(--color-accent)' }}
                      />
                      <input
                        type="text"
                        className="input"
                        value={option.option_text}
                        onChange={e => handleOptionChange(i, 'option_text', e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No questions found</div>
          <p className="empty-state-text">Add your first question to the question bank.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card card-hover" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{q.subjects?.name}</span>
                    <span className={`badge ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>
                  </div>
                  <p style={{ fontWeight: 500, marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>{q.question_text}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
                    {q.options?.map((opt, oi) => (
                      <div key={opt.id} style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-sm)',
                        background: opt.is_correct ? 'var(--color-success-light)' : 'rgba(148,163,184,0.06)',
                        color: opt.is_correct ? 'var(--color-success)' : 'var(--color-text-secondary)',
                        border: opt.is_correct ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)',
                      }}>
                        {String.fromCharCode(65 + oi)}. {opt.option_text}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(q)} title="Edit">
                    <HiOutlinePencil size={18} />
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(q.id)} title="Delete" style={{ color: 'var(--color-error)' }}>
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

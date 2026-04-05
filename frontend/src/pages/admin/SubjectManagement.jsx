import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      toast.error('Failed to load subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSubject) {
        // Update
        const { error } = await supabase
          .from('subjects')
          .update({ name: formData.name, description: formData.description })
          .eq('id', editingSubject.id);
        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        // Create
        const { error } = await supabase
          .from('subjects')
          .insert([{ name: formData.name, description: formData.description }]);
        if (error) throw error;
        toast.success('Subject created successfully');
      }
      fetchSubjects();
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? This might fail if there are tests or questions linked to it.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Cannot delete subject: It has associated questions or tests.');
        }
        throw error;
      }
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete subject');
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Management</h1>
          <p className="page-subtitle">Add or edit academic subjects for tests and questions</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <HiOutlinePlus size={20} /> Add Subject
        </button>
      </div>

      <div className="grid-cards stagger-children">
        {subjects.map((subject) => (
          <div key={subject.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
              <div className="stat-card-icon" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                <HiOutlineAcademicCap size={24} />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--color-info)' }}
                  onClick={() => openEditModal(subject)}
                  title="Edit"
                >
                  <HiOutlinePencil size={18} />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => handleDelete(subject.id)}
                  title="Delete"
                >
                  <HiOutlineTrash size={18} />
                </button>
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              {subject.name}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', flex: 1 }}>
              {subject.description || 'No description provided.'}
            </p>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="empty-state">
          <HiOutlineAcademicCap className="empty-state-icon" />
          <p className="empty-state-title">No subjects found</p>
          <p className="empty-state-text">Start by adding your first academic subject.</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={openAddModal}>
            Add Subject
          </button>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label>Subject Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Computer Science, Mathematics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    className="input"
                    placeholder="A brief overview of the subject..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

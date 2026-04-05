import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${status} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: This only deletes from the public.users table. 
      // Supabase Auth deletion usually requires admin API or a trigger.
      // Based on schema.sql, public.users has a FK to auth.users with ON DELETE CASCADE.
      // But we can't easily delete from auth.users from client without service role.
      // We'll proceed with public.users deletion which might fail if RLS is tight.
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
      console.error(err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading && users.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-primary">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users, roles, and approvals</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchUsers}>
          <HiOutlineRefresh size={18} /> Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} 
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="input"
                style={{ paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ width: '150px' }}>
            <select
              className="input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="input-group" style={{ width: '150px' }}>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container animate-fade-in-up">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td>
                    <select
                      className="input btn-sm"
                      style={{ padding: '2px 8px', width: 'auto', background: 'transparent' }}
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${
                      user.status === 'approved' ? 'badge-success' :
                      user.status === 'rejected' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-minor)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {user.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-success btn-sm btn-icon"
                            onClick={() => handleUpdateStatus(user.id, 'approved')}
                            title="Approve"
                          >
                            <HiOutlineCheck size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleUpdateStatus(user.id, 'rejected')}
                            title="Reject"
                          >
                            <HiOutlineX size={16} />
                          </button>
                        </>
                      )}
                      {user.status === 'rejected' && (
                        <button
                          className="btn btn-success btn-sm btn-icon"
                          onClick={() => handleUpdateStatus(user.id, 'approved')}
                          title="Restore/Approve"
                        >
                          <HiOutlineCheck size={16} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                  <div className="empty-state">
                    <HiOutlineUsers className="empty-state-icon" />
                    <p className="empty-state-title">No users found</p>
                    <p className="empty-state-text">Try adjusting your filters or search term.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

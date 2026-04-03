import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * RegisterPage — User registration with name, email, password, and role selection.
 * Admin accounts can only be created via seed data (not self-registration).
 */
export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name, role);
      toast.success('Registration successful! Awaiting admin approval.');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} id="register-form">
      <h2>Create Account</h2>

      {error && <div className="auth-error">{error}</div>}

      <div className="input-group">
        <label htmlFor="register-name">Full Name</label>
        <input
          id="register-name"
          type="text"
          className="input"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="input-group">
        <label htmlFor="register-email">Email Address</label>
        <input
          id="register-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="register-role">I am a</label>
        <select
          id="register-role"
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          className="input"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="input-group">
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input
          id="register-confirm-password"
          type="password"
          className="input"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading}
        id="register-submit"
        style={{ width: '100%' }}
      >
        {loading ? (
          <>
            <span className="spinner spinner-sm" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="auth-form-footer">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * LoginPage — Email + password authentication form
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await signIn(email, password);
      toast.success('Welcome back!');

      // Navigate based on role will be handled by App routing
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} id="login-form">
      <h2>Welcome Back</h2>

      {error && <div className="auth-error">{error}</div>}

      <div className="input-group">
        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="input-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          className="input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading}
        id="login-submit"
        style={{ width: '100%' }}
      >
        {loading ? (
          <>
            <span className="spinner spinner-sm" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="auth-form-footer">
        Don't have an account?{' '}
        <Link to="/register">Create one</Link>
      </div>
    </form>
  );
}

import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

/**
 * AuthLayout — Centered card layout for login/register pages
 * with gradient background and animated decorative elements.
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Decorative background elements */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="auth-container animate-scale-in">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
              <path d="M12 26V14l8 6-8 6zm8-6l8-6v12l-8-6z" fill="white" opacity="0.9" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-title">AssessHub</h1>
          <p className="auth-tagline">Online Assessment & Evaluation Platform</p>
        </div>

        <div className="auth-card glass">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

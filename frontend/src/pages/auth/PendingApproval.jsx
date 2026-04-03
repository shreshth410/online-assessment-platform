import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineClock, HiOutlineLogout } from 'react-icons/hi';
import toast from 'react-hot-toast';

/**
 * PendingApproval — Shown to users whose status is 'pending'.
 * They can refresh to check approval status or sign out.
 */
export default function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    await refreshProfile();
    toast('Checking approval status...', { icon: '🔄' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="pending-approval">
      <div className="pending-card glass animate-scale-in">
        <div className="pending-icon">
          <HiOutlineClock size={64} />
        </div>
        <h1 className="pending-title">Awaiting Approval</h1>
        <p className="pending-text">
          Hi <strong>{profile?.name}</strong>, your account has been created successfully.
          An administrator needs to approve your account before you can access the platform.
        </p>
        <p className="pending-role">
          Registered as: <span className="badge badge-primary">{profile?.role}</span>
        </p>
        <div className="pending-actions">
          <button className="btn btn-primary" onClick={handleRefresh}>
            Check Status
          </button>
          <button className="btn btn-secondary" onClick={handleSignOut}>
            <HiOutlineLogout size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <style>{`
        .pending-approval {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
          background: var(--gradient-hero);
        }
        .pending-card {
          max-width: 480px;
          width: 100%;
          padding: var(--space-2xl);
          text-align: center;
        }
        .pending-icon {
          color: var(--color-warning);
          margin-bottom: var(--space-lg);
          animation: pulse 2s ease-in-out infinite;
        }
        .pending-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: var(--space-md);
        }
        .pending-text {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          line-height: 1.7;
          margin-bottom: var(--space-md);
        }
        .pending-role {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xl);
        }
        .pending-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

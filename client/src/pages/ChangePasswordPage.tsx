import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordPageProps {
  onSuccess?: () => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onSuccess }) => {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live password validation checklist
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    currentPassword.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage('Please satisfy all password security requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
    } catch (_err) {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3"
      style={{ backgroundColor: 'var(--page-bg, #F5F7F6)' }}
    >
      <div
        className="card shadow-sm border-0 w-100"
        style={{ maxWidth: '460px', borderRadius: '12px', overflow: 'hidden' }}
      >
        <div style={{ height: '6px', backgroundColor: 'var(--warning-accent, #D97706)' }} />

        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary, #1A2E22)' }}>
              Change Your Password
            </h3>
            <p className="text-muted small">
              Hello, <span className="fw-semibold text-dark">{user?.name}</span>. You must set a new secure password
              before continuing into the application.
            </p>
          </div>

          {errorMessage && (
            <div
              className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center small"
              role="alert"
              style={{ borderRadius: '8px' }}
            >
              <svg className="me-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="current-password" className="form-label small fw-semibold text-dark mb-1">
                Current (Temporary) Password
              </label>
              <input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="new-password" className="form-label small fw-semibold text-dark mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Choose a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirm-password" className="form-label small fw-semibold text-dark mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-check mb-3">
              <input
                id="toggle-show-passwords"
                type="checkbox"
                className="form-check-input"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="toggle-show-passwords" className="form-check-label small text-muted">
                Show passwords
              </label>
            </div>

            {/* Live Requirements Checklist */}
            <div className="p-3 mb-4 rounded bg-light border" style={{ fontSize: '0.8rem' }}>
              <div className="fw-semibold text-dark mb-2">Password must:</div>
              <ul className="list-unstyled mb-0">
                <li className={`d-flex align-items-center mb-1 ${hasMinLength ? 'text-success' : 'text-muted'}`}>
                  <span className="me-2">{hasMinLength ? '✓' : '○'}</span> Be at least 8 characters
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasUpper && hasLower ? 'text-success' : 'text-muted'}`}>
                  <span className="me-2">{hasUpper && hasLower ? '✓' : '○'}</span> Include uppercase and lowercase letters
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasNumber && hasSpecial ? 'text-success' : 'text-muted'}`}>
                  <span className="me-2">{hasNumber && hasSpecial ? '✓' : '○'}</span> Include at least one number and special character
                </li>
                <li className={`d-flex align-items-center ${passwordsMatch ? 'text-success' : 'text-muted'}`}>
                  <span className="me-2">{passwordsMatch ? '✓' : '○'}</span> Passwords match
                </li>
              </ul>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary py-2 flex-grow-1"
                onClick={logout}
                disabled={isSubmitting}
              >
                Sign Out
              </button>
              <button
                type="submit"
                className="btn text-white py-2 flex-grow-1 fw-semibold"
                style={{
                  backgroundColor: isFormValid ? 'var(--primary-green, #006B3C)' : '#9CA3AF',
                  borderColor: isFormValid ? 'var(--primary-green, #006B3C)' : '#9CA3AF',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                }}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please try again.');
      }
    } catch (_err) {
      setErrorMessage('Failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMessage(null);
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3"
      style={{ backgroundColor: 'var(--page-bg, #F5F7F6)' }}
    >
      <div
        className="card shadow-sm border-0 w-100"
        style={{ maxWidth: '440px', borderRadius: '12px', overflow: 'hidden' }}
      >
        {/* Brand Accent Top Bar */}
        <div style={{ height: '6px', backgroundColor: 'var(--primary-green, #006B3C)' }} />

        <div className="card-body p-4 p-md-5">
          {/* Brand Logo & Heading */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'var(--pale-green, #EAF6EF)',
                color: 'var(--primary-green, #006B3C)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--text-primary, #1A2E22)', fontSize: '1.6rem' }}>
              TokTickIT
            </h2>
            <p className="text-muted small">Sign in with your organizational account</p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              className="alert alert-danger py-2 px-3 mb-4 d-flex align-items-center small"
              role="alert"
              style={{
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                borderColor: '#FCA5A5',
                color: '#991B1B',
              }}
            >
              <svg className="me-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label small fw-semibold text-dark mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="name@kmutt.ac.th or name@toktickit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="login-password" className="form-label small fw-semibold text-dark mb-0">
                  Password
                </label>
              </div>
              <div className="input-group">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-100 py-2 fw-semibold text-white d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: 'var(--primary-green, #006B3C)',
                borderColor: 'var(--primary-green, #006B3C)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Testing Credentials Callout for TA grading convenience */}
          <div className="mt-4 pt-3 border-top">
            <p className="text-muted small mb-2 fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              Quick Demo Logins (Password: Password123!)
            </p>
            <div className="d-flex flex-wrap gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-success py-1 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('supanut.soph@kmutt.ac.th', 'Password123!')}
              >
                Requester
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-1 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('michael.b@toktickit.com', 'Password123!')}
              >
                IT Staff
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning py-1 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('alex.t@toktickit.com', 'Initial123!')}
                title="Tests mandatory first-login password change"
              >
                1st Login (Alex)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark py-1 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('admin@toktickit.com', 'Password123!')}
              >
                Administrator
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger py-1 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleQuickLogin('mwl@kmutt.ac.th', 'Password123!')}
                title="Tests inactive account rejection"
              >
                Inactive User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

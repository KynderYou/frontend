import { useState } from 'react';
import { ApiError, login } from '../../api';
import type { Member } from '../../api';
import logo from '../../assets/midna-logo.png';

type AuthPageProps = {
  onAuthenticated: (member: Member) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await login({ email, password });
      onAuthenticated(result.member);
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          typeof err.body === 'object' && err.body !== null && 'detail' in err.body
            ? String((err.body as { detail: unknown }).detail)
            : err.message;
        setError(detail || 'Sign in failed.');
      } else {
        setError('Unable to connect to the server. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Member sign in">
        <div className="auth-form-panel">
          <img className="auth-logo" src={logo} alt="Midna" />

          <div className="auth-heading">
            <span className="auth-eyebrow">Member portal</span>
            <h1>Member sign in</h1>
            <p>Scans · Reports · Billing · Counselling</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Member email</span>
              <div className="auth-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@midna.com"
                  disabled={loading}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.5 10.5 0 0 1 12 4c5 0 9 4 10 8a12.7 12.7 0 0 1-2.1 4.2M6.6 6.6A12.4 12.4 0 0 0 2 12c1 4 5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div className="auth-form-options">
              <label className="auth-checkbox">
                <input name="remember" type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="auth-text-button">
                Need help?
              </button>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>

        <aside className="auth-visual-panel">
          <div className="auth-visual-glow auth-visual-glow-one" />
          <div className="auth-visual-glow auth-visual-glow-two" />
          <div className="auth-visual-copy">
            <span className="auth-visual-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Members only
            </span>
            <h2>Scans. Reports. Counselling. One workspace.</h2>
            <p>Assigned work · Client data · Reports · CAB audio</p>
          </div>

          <div className="auth-preview">
            <div className="auth-preview-head">
              <div>
                <span>Reports overview</span>
                <strong>July 2026</strong>
              </div>
              <span className="auth-preview-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M8 13h8M8 17h5" />
                </svg>
              </span>
            </div>
            <div className="auth-preview-stats">
              <div><strong>24</strong><span>Total scans</span></div>
              <div><strong>19</strong><span>Reports ready</span></div>
              <div><strong>08</strong><span>CAB audios</span></div>
            </div>
            <div className="auth-preview-progress">
              <span><i />Monthly progress</span>
              <strong>79%</strong>
            </div>
            <div className="auth-preview-bar"><span /></div>
          </div>

          <p className="auth-copyright">© 2026 Midna Global. All rights reserved.</p>
        </aside>
      </section>
    </main>
  );
}

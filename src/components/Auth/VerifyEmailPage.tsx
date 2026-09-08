import { useEffect, useState } from 'react';
import { ApiError, verifyEmail } from '../../api';
import logo from '../../assets/midna-logo.png';

type VerifyEmailPageProps = {
  token: string | null;
  onGoToSignIn: () => void;
};

export function VerifyEmailPage({ token, onGoToSignIn }: VerifyEmailPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>(
    token ? 'loading' : 'missing',
  );
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    verifyEmail(token)
      .then((result) => {
        if (cancelled) return;
        setEmail(result.email);
        setMessage(result.message);
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          const detail =
            typeof err.body === 'object' && err.body !== null && 'detail' in err.body
              ? String((err.body as { detail: unknown }).detail)
              : err.message;
          setMessage(detail || 'Verification failed.');
        } else {
          setMessage('Unable to reach the server. Please try again later.');
        }
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact" aria-label="Verify email">
        <div className="auth-form-panel">
          <img className="auth-logo" src={logo} alt="Midna" />

          <div className="auth-heading">
            <span className="auth-eyebrow">Member portal</span>
            <h1>Verify your email</h1>
            <p>Confirm your address to activate your Midna account.</p>
          </div>

          {status === 'loading' ? (
            <p className="auth-status-copy">Verifying your link…</p>
          ) : null}

          {status === 'missing' ? (
            <p className="auth-error" role="alert">
              This verification link is missing or invalid.
            </p>
          ) : null}

          {status === 'success' ? (
            <>
              <p className="auth-status-copy auth-status-copy--success" role="status">
                {message}
              </p>
              {email ? <p className="auth-status-copy">Verified address: {email}</p> : null}
            </>
          ) : null}

          {status === 'error' ? (
            <p className="auth-error" role="alert">
              {message}
            </p>
          ) : null}

          <button type="button" className="auth-submit" onClick={onGoToSignIn}>
            Go to sign in
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}

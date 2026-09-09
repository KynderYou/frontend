import { useEffect, useState } from 'react';
import { ApiError, verifyEmail } from '../../api';
import logo from '../../assets/midna-logo.png';

type VerifyEmailPageProps = {
  token: string | null;
  onGoToSignIn: () => void;
};

type VerifyStatus = 'loading' | 'success' | 'error' | 'missing';

function headingCopy(status: VerifyStatus): { title: string; subtitle: string } {
  if (status === 'success') {
    return {
      title: 'Email verified',
      subtitle: 'Your Midna Global account is active. You can sign in now.',
    };
  }
  if (status === 'loading') {
    return {
      title: 'Verifying email',
      subtitle: 'Confirming your link — usually under a second.',
    };
  }
  if (status === 'missing') {
    return {
      title: 'Link missing',
      subtitle: 'Open the verification link from your Midna Global email to continue.',
    };
  }
  return {
    title: 'Unable to verify',
    subtitle: 'This link is invalid or has already been used. Try signing in, or ask admin to resend.',
  };
}

export function VerifyEmailPage({ token, onGoToSignIn }: VerifyEmailPageProps) {
  const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    setStatus('loading');

    verifyEmail(token, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setEmail(result.email);
        setMessage(result.message);
        setStatus('success');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && (err.status === 0 || err.statusText === 'Aborted')) return;
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

    return () => controller.abort();
  }, [token]);

  const copy = headingCopy(status);
  const subtitle =
    status === 'success' && email
      ? `${email} is verified. You can sign in now.`
      : status === 'error' && message
        ? message
        : copy.subtitle;

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact" aria-label="Verify email">
        <div className="auth-form-panel auth-verify-panel">
          <img className="auth-logo" src={logo} alt="Midna Global" />

          <div className="auth-heading">
            <span className="auth-eyebrow">Member portal</span>
            <h1>{copy.title}</h1>
            <p className={status === 'success' ? 'auth-verify-subtitle is-success' : undefined}>{subtitle}</p>
          </div>

          {status === 'loading' ? (
            <p className="auth-status-copy auth-verify-status" role="status">
              Verifying…
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

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { colors, radius, shadow } from '../../styles/theme';

const theme = colors.light;

type ToastType = 'success' | 'error';

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      {items.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              borderRadius: radius.md,
              background: isSuccess ? theme['success-bg'] : theme['error-bg'],
              color: isSuccess ? theme.success : theme.error,
              border: `1px solid ${isSuccess ? 'rgba(81, 207, 102, 0.35)' : 'rgba(250, 82, 82, 0.35)'}`,
              boxShadow: shadow.float,
              maxWidth: 420,
              width: '100%',
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
              <ToastIcon type={toast.type} />
            </span>
            <p style={{ margin: 0, flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: theme['text-primary'] }}>
              {toast.message}
            </p>
            <button
              type="button"
              className="btn-icon toast-dismiss"
              aria-label="Dismiss"
              onClick={() => onDismiss(toast.id)}
              style={{ width: 28, height: 28, flexShrink: 0, color: theme['text-muted'] }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current, { id, type, message: trimmed }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message: string) => push('success', message),
      showError: (message: string) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

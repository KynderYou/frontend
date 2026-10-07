import { useState } from 'react';
import { createPortal } from 'react-dom';

const TIP_WIDTH = 300;
const GAP = 8;

type InfoTipProps = {
  label: string;
  children: React.ReactNode;
};

type TipPosition = { top: number; left: number };

export function InfoTip({ label, children }: InfoTipProps) {
  const [position, setPosition] = useState<TipPosition | null>(null);

  const show = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const centered = rect.left + rect.width / 2 - TIP_WIDTH / 2;
    const left = Math.min(Math.max(GAP, centered), window.innerWidth - TIP_WIDTH - GAP);
    setPosition({ top: rect.bottom + GAP, left });
  };
  const hide = () => setPosition(null);

  return (
    <>
      <button
        type="button"
        className="info-tip-trigger"
        aria-label={label}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      {position
        ? createPortal(
            <div className="info-tip-bubble" role="tooltip" style={{ top: position.top, left: position.left, width: TIP_WIDTH }}>
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

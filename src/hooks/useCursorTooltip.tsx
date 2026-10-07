import { useCallback, useRef, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

/**
 * Instant tooltip that follows the cursor (native `title` tooltips wait ~1s).
 * Positions are written straight to the DOM so mouse moves don't re-render the table.
 */
export function useCursorTooltip() {
  const ref = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    if (ref.current) ref.current.style.opacity = '0';
  }, []);

  const bind = useCallback(
    (text: string | null | undefined) => {
      if (!text) return {};
      const move = (e: MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        el.textContent = text;
        el.style.transform = `translate(${e.clientX + 12}px, ${e.clientY + 16}px)`;
        el.style.opacity = '1';
      };
      return { onMouseEnter: move, onMouseMove: move, onMouseLeave: hide };
    },
    [hide],
  );

  const tooltip = createPortal(<div ref={ref} className="cursor-tooltip" role="tooltip" />, document.body);

  return { bind, tooltip };
}

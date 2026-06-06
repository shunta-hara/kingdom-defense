import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Toast as ToastItem } from '../../types/game';

// ---- Styles ----

const TOAST_COLORS: Record<ToastItem['type'], string> = {
  success: '#2ecc71',
  info: '#3498db',
  warning: '#e67e22',
};

const TOAST_BG: Record<ToastItem['type'], string> = {
  success: 'rgba(46, 204, 113, 0.15)',
  info: 'rgba(52, 152, 219, 0.15)',
  warning: 'rgba(230, 126, 34, 0.15)',
};

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
};

function toastItemStyle(type: ToastItem['type']): React.CSSProperties {
  return {
    background: TOAST_BG[type],
    border: `1px solid ${TOAST_COLORS[type]}`,
    borderLeft: `4px solid ${TOAST_COLORS[type]}`,
    borderRadius: 6,
    padding: '10px 16px',
    color: '#f0e8d0',
    fontFamily: "'Crimson Text', serif",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    minWidth: 200,
    maxWidth: 320,
    animation: 'toastSlideIn 0.3s ease-out forwards',
    pointerEvents: 'auto',
  };
}

// ---- ToastEntry ----

type ToastEntryProps = {
  toast: ToastItem;
  onRemove: (id: string) => void;
};

function ToastEntry({ toast, onRemove }: ToastEntryProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, 2800);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [toast.id, onRemove]);

  return (
    <div style={toastItemStyle(toast.type)} role="alert" aria-live="polite">
      {toast.message}
    </div>
  );
}

// ---- Toast Container ----

export function Toast() {
  const toasts = useGameStore((s) => s.toasts);
  const removeToast = useGameStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          0%   { opacity: 0; transform: translateX(60px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={containerStyle} aria-label="通知">
        {toasts.map((t) => (
          <ToastEntry key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}

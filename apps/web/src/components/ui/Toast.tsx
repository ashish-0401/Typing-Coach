import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: ReactNode;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function dismiss() {
    setVisible(false);
    window.setTimeout(() => onCloseRef.current(), 220);
  }

  // Enter animation + auto-dismiss, set up once so parent re-renders never reset the timer.
  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => onCloseRef.current(), 220);
    }, duration);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(timer);
    };
  }, [duration]);

  return (
    <div className="fixed right-6 top-20 z-50">
      <div
        className={
          'flex items-center gap-3 rounded-xl border border-accent/40 bg-elevated/95 px-5 py-3.5 ' +
          'shadow-2xl shadow-black/50 ring-1 ring-accent/20 backdrop-blur ' +
          'transition-all duration-300 ease-out ' +
          (visible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-3 scale-95 opacity-0')
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <div className="text-sm text-foreground">{message}</div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-2 shrink-0 text-muted transition-colors duration-200 hover:text-foreground cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

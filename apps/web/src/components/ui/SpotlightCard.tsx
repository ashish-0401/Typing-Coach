import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A card that tracks the cursor with a soft radial spotlight on hover. */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-md transition-all duration-300 hover:border-primary/40 hover:shadow-lg',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(22rem 22rem at var(--mx) var(--my), rgb(124 108 246 / 0.14), transparent 65%)',
        }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

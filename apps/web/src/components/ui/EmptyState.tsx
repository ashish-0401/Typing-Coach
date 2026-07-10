import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A full-height, centered empty state built around the dojo motif: a floating
 * keycap emblem haloed by expanding "enso" rings. It fills the vertical space a
 * lone card would leave empty, and turns a dead screen into an invitation.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  secondary,
  className,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(
        'flex min-h-[56vh] flex-col items-center justify-center px-6 text-center',
        className,
      )}
    >
      <div className="relative grid size-44 place-items-center">
        {/* Expanding enso rings, staggered so a new one blooms as the last fades. */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="dojo-ripple absolute inset-0 m-auto size-28 rounded-full border border-primary/30"
            style={{ animationDelay: `${i * 1.1}s` }}
          />
        ))}
        {/* Static halo so the emblem never sits on empty space between ripples. */}
        <span
          aria-hidden
          className="absolute inset-0 m-auto size-24 rounded-full bg-primary/10 blur-xl"
        />
        {/* The keycap emblem. */}
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="animate-float relative z-10 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/30 to-accent/10 text-accent shadow-glow ring-1 ring-primary/30"
        >
          <Icon className="size-8" strokeWidth={1.75} />
        </motion.span>
      </div>

      {eyebrow && (
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-pretty text-muted">{description}</p>

      {(action || secondary) && (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          {action}
          {secondary}
        </div>
      )}
    </motion.div>
  );
}

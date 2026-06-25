import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const VALUE_PROPS = [
  'Real-time WPM, accuracy & error tracking',
  'Every session saved, kept forever',
  'A coach that remembers and trains you',
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="grid w-full max-w-5xl grid-cols-2 overflow-hidden rounded-3xl border border-border bg-card/80 shadow-lg backdrop-blur-xl"
      >
        {/* Brand panel */}
        <div className="relative flex flex-col justify-between overflow-hidden p-12">
          <motion.div
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <img
              src="/WazaKey.png"
              alt="WazaKey"
              className="h-9 w-9 rounded-lg ring-1 ring-border"
            />
            <span className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight">
                <span className="text-foreground">Waza</span>
                <span className="text-accent">Key</span>
              </span>
              <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-muted">
                Typing Dojo
              </span>
            </span>
          </div>

          <div className="relative my-10">
            <h2 className="font-heading text-5xl font-bold leading-[1.05] tracking-tight text-foreground">
              Type with{' '}
              <span className="bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                technique.
              </span>
            </h2>
            <svg
              viewBox="0 0 220 14"
              fill="none"
              className="mt-2 h-3.5 w-56"
              aria-hidden
            >
              <motion.path
                d="M3 9 C 45 2, 90 12, 135 6 S 205 4, 217 8"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.5 }}
              />
            </svg>

            <div className="mt-7 rounded-xl border border-border bg-background/40 p-4 font-mono text-sm backdrop-blur">
              <span className="text-foreground">the quick brown</span>
              <span className="text-muted"> fox jumps</span>
              <motion.span
                className="ml-0.5 inline-block h-5 w-[3px] -translate-y-[1px] rounded-full bg-accent align-middle"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>

          <ul className="relative space-y-3">
            {VALUE_PROPS.map((prop, index) => (
              <motion.li
                key={prop}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.12, ease: EASE }}
                className="flex items-center gap-3 text-sm text-muted"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {prop}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="relative border-l border-border bg-background/40 p-12">
          <div className="absolute right-4 top-4 flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/"
              aria-label="Back to typing test"
              title="Back to typing test"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-elevated hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}

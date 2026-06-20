import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 transition-colors duration-200 ${className}`}
      {...props}
    />
  );
}

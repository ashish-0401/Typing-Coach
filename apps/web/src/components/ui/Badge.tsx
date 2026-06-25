import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-elevated text-muted',
        accent: 'border-accent/30 bg-accent/10 text-accent',
        success: 'border-success/30 bg-success/10 text-success',
        mono: 'border-border bg-elevated font-mono text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

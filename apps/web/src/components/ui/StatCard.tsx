import type { LucideIcon } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { AnimatedNumber } from './motion';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  suffix = '',
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  suffix?: string;
}) {
  return (
    <SpotlightCard className="h-full">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-accent ring-1 ring-primary/15">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-mono text-4xl font-semibold tabular-nums text-foreground">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </SpotlightCard>
  );
}

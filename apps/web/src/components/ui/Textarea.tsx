import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({
  className,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full resize-none rounded-xl border border-border bg-elevated px-4 py-3 text-foreground ' +
          'placeholder:text-muted outline-none transition-colors duration-200 ' +
          'focus:border-primary/60 focus:ring-2 focus:ring-ring/30',
        className,
      )}
      {...props}
    />
  );
}

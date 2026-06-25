import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-11 rounded-xl border border-border bg-elevated px-4 text-foreground ' +
            'placeholder:text-muted outline-none transition-colors duration-200 ' +
            'focus:border-primary/60 focus:ring-2 focus:ring-ring/30',
          className,
        )}
        {...props}
      />
    </div>
  );
}

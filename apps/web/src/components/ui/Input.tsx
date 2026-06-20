import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
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
        className={
          'rounded-lg border border-border bg-card px-4 py-2.5 text-foreground ' +
          'placeholder:text-muted transition-colors duration-200 focus:border-primary ' +
          'focus:outline-none focus:ring-2 focus:ring-ring/40 ' +
          className
        }
        {...props}
      />
    </div>
  );
}

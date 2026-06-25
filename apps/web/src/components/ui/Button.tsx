import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ' +
    'transition-all duration-200 cursor-pointer outline-none select-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-glow hover:bg-primary-hover active:scale-[0.98]',
        secondary:
          'border border-border bg-elevated text-foreground hover:border-foreground/20 active:scale-[0.98]',
        ghost: 'text-muted hover:bg-elevated hover:text-foreground',
        outline:
          'border border-primary/40 text-primary hover:bg-primary/10 active:scale-[0.98]',
        destructive: 'bg-error text-white hover:opacity-90 active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-10 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

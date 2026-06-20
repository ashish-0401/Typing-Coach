import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { ThemeToggle } from '../ThemeToggle';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex max-w-md flex-col px-6 pt-6">
        <span className="font-heading text-xl font-semibold text-foreground">
          AI Practice Coach
        </span>
        <h1 className="mt-8 font-heading text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        <Card className="mt-6">{children}</Card>
      </div>
    </div>
  );
}

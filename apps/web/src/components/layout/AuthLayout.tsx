import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="flex items-center justify-between p-4">
        <Link
          to="/typing"
          aria-label="Back to typing test"
          title="Back to typing test"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-card hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Link>
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

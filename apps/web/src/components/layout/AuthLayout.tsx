import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
}

const VALUE_PROPS = [
    "Real-time WPM, accuracy & error tracking",
    "Every session saved, kept forever",
    "A coach that remembers and trains you",
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
            <div className="grid w-full max-w-4xl grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20">
                {/* Brand panel */}
                <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-accent/15 via-card to-card p-10">
                    <div
                        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
                        aria-hidden
                    />
                    <div className="flex items-center gap-2">
                        <img src="/WazaKey.png" alt="WazaKey" className="h-8 w-8 rounded-md" />
                        <span className="leading-tight">
                            <span className="block text-lg font-semibold tracking-tight">
                                <span className="text-foreground">Waza</span>
                                <span className="text-accent">Key</span>
                            </span>
                            <span className="block text-center font-mono text-[11px] font-medium tracking-widest text-muted">
                                Your Typing Dojo
                            </span>
                        </span>
                    </div>

                    <div className="my-10">
                        <h2 className="font-heading text-4xl font-semibold leading-tight text-foreground">
                            Type with <span className="text-accent">technique.</span>
                        </h2>
                        <div className="mt-6 rounded-lg border border-border bg-background/40 p-4 font-mono text-sm">
                            <span className="text-foreground">the quick brown</span>
                            <span className="text-muted"> fox jumps</span>
                            <span className="ml-0.5 inline-block h-5 w-[3px] -translate-y-[1px] animate-pulse rounded-full bg-accent align-middle" />
                        </div>
                    </div>

                    <ul className="space-y-3">
                        {VALUE_PROPS.map((prop) => (
                            <li key={prop} className="flex items-center gap-3 text-sm text-muted">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 shrink-0 text-accent"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                                {prop}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Form panel */}
                <div className="relative p-10">
                    <div className="absolute right-4 top-4 flex items-center gap-1">
                        <ThemeToggle />
                        <Link
                            to="/"
                            aria-label="Back to typing test"
                            title="Back to typing test"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-elevated hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    </div>

                    <div className="mt-6">
                        <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>
                        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                    </div>

                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}

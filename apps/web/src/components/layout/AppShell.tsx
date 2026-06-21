import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../lib/auth";

function navLinkClass({ isActive }: { isActive: boolean }): string {
    return (
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 " +
        (isActive ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground")
    );
}

export function AppShell() {
    const navigate = useNavigate();
    const user = useAuth((s) => s.user);
    const logout = useAuth((s) => s.logout);

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-card/60 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-3 font-heading text-foreground">
                            <img src="/WazaKey.png" alt="WazaKey" className="h-9 w-9 rounded-md" />
                            <span className="leading-tight">
                                <span className="block text-xl font-semibold">
                                    <span className="text-foreground">Waza</span>
                                    <span className="text-accent">Key</span>
                                </span>
                                <span className="block text-center font-mono text-[11px] font-medium tracking-widest text-muted">
                                    Your Typing Dojo
                                </span>
                            </span>
                        </Link>
                        <nav className="flex items-center gap-1">
                            <NavLink to="/" end className={navLinkClass}>
                                Practice
                            </NavLink>
                            {user && (
                                <NavLink to="/dashboard" className={navLinkClass}>
                                    Dashboard
                                </NavLink>
                            )}
                            {user && (
                                <NavLink to="/history" className={navLinkClass}>
                                    History
                                </NavLink>
                            )}
                            {user && (
                                <NavLink to="/profile" className={navLinkClass}>
                                    Profile
                                </NavLink>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <UserMenu name={user.name} email={user.email} onLogout={handleLogout} />
                        ) : (
                            <NavLink to="/login" className={navLinkClass}>
                                Log in
                            </NavLink>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                <Outlet />
            </main>
        </div>
    );
}

function UserMenu({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const initial = name.trim().charAt(0).toUpperCase() || "?";

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors duration-200 hover:bg-elevated cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 font-mono text-sm font-semibold text-accent">
                    {initial}
                </span>
                <span className="font-medium">{name}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-elevated shadow-xl shadow-black/30"
                >
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-xs text-muted">Signed in as</p>
                        <p className="break-all text-sm text-foreground">{email}</p>
                    </div>
                    <Link
                        to="/settings"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted transition-colors duration-200 hover:bg-card hover:text-foreground cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                        >
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Settings
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted transition-colors duration-200 hover:bg-card hover:text-foreground cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="m16 17 5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}

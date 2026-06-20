import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return (
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ' +
    (isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground')
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-heading text-lg font-semibold text-foreground">
              AI Practice Coach
            </span>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Style Guide
              </NavLink>
              <NavLink to="/health" className={navLinkClass}>
                Health
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted">{user.email}</span>
                <Button variant="ghost" onClick={handleLogout}>
                  Log out
                </Button>
              </>
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

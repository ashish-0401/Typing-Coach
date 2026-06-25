import {
  NavLink,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../lib/auth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Practice', end: true, authed: false },
  { to: '/dashboard', label: 'Dashboard', authed: true },
  { to: '/history', label: 'History', authed: true },
  { to: '/profile', label: 'Profile', authed: true },
  { to: '/coach', label: 'Coach', authed: true },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive ? 'text-foreground' : 'text-muted hover:text-foreground',
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-7">
            <Link to="/" className="group flex items-center gap-3">
              <img
                src="/WazaKey.png"
                alt="WazaKey"
                className="h-9 w-9 rounded-lg ring-1 ring-border transition-transform duration-200 group-hover:scale-105"
              />
              <span className="leading-tight">
                <span className="block text-lg font-semibold tracking-tight">
                  <span className="text-foreground">Waza</span>
                  <span className="text-accent">Key</span>
                </span>
                <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-muted">
                  Typing Dojo
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.filter((link) => !link.authed || user).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu
                name={user.name}
                email={user.email}
                onLogout={handleLogout}
              />
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function UserMenu({
  name,
  email,
  onLogout,
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none transition-colors duration-200 hover:bg-elevated focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-elevated">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-sm font-semibold text-accent ring-1 ring-primary/20">
          {initial}
        </span>
        <span className="font-medium">{name}</span>
        <ChevronDown className="size-4 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 overflow-hidden rounded-xl border border-border bg-elevated p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          <div className="px-3 py-2.5">
            <p className="text-xs text-muted">Signed in as</p>
            <p className="break-all text-sm font-medium text-foreground">
              {email}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              to="/settings"
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors data-highlighted:bg-card data-highlighted:text-foreground"
            >
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onLogout}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors data-highlighted:bg-card data-highlighted:text-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

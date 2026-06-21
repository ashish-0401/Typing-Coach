import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeading } from '../components/ui/PageHeading';

const MAX_NAME = 40;

export function SettingsPage() {
  const user = useAuth((s) => s.user);
  const setAuth = useAuth((s) => s.setAuth);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  const currentName = user?.name ?? '';
  const [name, setName] = useState(currentName);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      const token = useAuth.getState().token;
      if (token) {
        // Refresh the auth store so greetings and the user menu update at once.
        setAuth(token, updatedUser);
      }
      setName(updatedUser.name);
    },
  });

  const trimmed = name.trim();
  const isEmpty = trimmed.length === 0;
  const isUnchanged = trimmed === currentName;
  const canSave = !isEmpty && !isUnchanged && !mutation.isPending;
  const showSaved = mutation.isSuccess && isUnchanged;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    mutation.mutate({ name: trimmed });
  }

  return (
    <div className="max-w-2xl">
      <PageHeading title="Settings" subtitle="Manage your account and preferences." />

      {/* Display name */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-foreground">Display name</h2>
        <p className="mt-1 text-sm text-muted">This is the name we greet you with.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            label="Name"
            type="text"
            autoComplete="name"
            maxLength={MAX_NAME}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={isEmpty}
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs">
              {isEmpty ? (
                <span className="text-error">Name can&apos;t be empty.</span>
              ) : showSaved ? (
                <span className="text-accent">Saved.</span>
              ) : mutation.isError ? (
                <span className="text-error">{mutation.error.message}</span>
              ) : (
                <span className="text-muted">
                  {trimmed.length}/{MAX_NAME}
                </span>
              )}
            </p>
            <Button type="submit" disabled={!canSave}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Theme */}
      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Theme</h2>
            <p className="mt-1 text-sm text-muted">Choose how WazaKey looks.</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-background p-1 font-mono text-xs">
            <ThemeOption
              label="Light"
              active={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeOption
              label="Dark"
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
          </div>
        </div>
      </Card>

      {/* Password (stubbed until a later phase) */}
      <Card className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Password</h2>
            <p className="mt-1 text-sm text-muted">Changing your password is coming soon.</p>
          </div>
          <Button variant="secondary" disabled>
            Change password
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ThemeOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'rounded-md px-3 py-1 transition-colors duration-200 cursor-pointer ' +
        (active ? 'bg-card text-accent' : 'text-muted hover:text-foreground')
      }
    >
      {label}
    </button>
  );
}

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerRequest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/', { replace: true, state: { justSignedUp: true } });
    },
  });

  const passwordsMatch = password === confirmPassword;
  const showMatchHint = confirmPassword.length > 0;
  const blockSubmit = showMatchHint && !passwordsMatch;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!passwordsMatch) {
      return;
    }
    mutation.mutate({ name, email, password });
  }

  const errorMessage = mutation.isError ? mutation.error.message : null;

  return (
    <AuthLayout title="Create your account" subtitle="A few quick details and you're in.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="What should we call you?"
          type="text"
          autoComplete="name"
          placeholder="Your name or a nickname"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-type it"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {showMatchHint && (
          <p
            className={`flex items-center gap-1.5 text-xs ${
              passwordsMatch ? 'text-accent' : 'text-error'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              {passwordsMatch ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              )}
            </svg>
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}
        {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || blockSubmit}
        >
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

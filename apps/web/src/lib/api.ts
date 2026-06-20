import { useAuth } from './auth';
import type { AuthUser } from './auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface HealthResponse {
  status: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return (await response.json()) as HealthResponse;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

interface ApiErrorBody {
  message?: string | string[];
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (body.message) {
      return body.message;
    }
  } catch {
    // response had no JSON body
  }
  return `Request failed with status ${response.status}`;
}

async function postCredentials(
  path: string,
  body: Credentials,
): Promise<AuthResult> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AuthResult;
}

export function registerRequest(body: Credentials): Promise<AuthResult> {
  return postCredentials('/auth/register', body);
}

export function loginRequest(body: Credentials): Promise<AuthResult> {
  return postCredentials('/auth/login', body);
}

export async function fetchMe(): Promise<AuthUser> {
  const token = useAuth.getState().token;
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AuthUser;
}


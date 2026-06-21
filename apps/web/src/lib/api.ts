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

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
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

async function postAuth(
  path: string,
  body: Credentials | RegisterInput,
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

export function registerRequest(body: RegisterInput): Promise<AuthResult> {
  return postAuth('/auth/register', body);
}

export function loginRequest(body: Credentials): Promise<AuthResult> {
  return postAuth('/auth/login', body);
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

export interface UpdateProfileInput {
  name: string;
}

export async function updateProfile(
  body: UpdateProfileInput,
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AuthUser;
}

function authHeaders(): Record<string, string> {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateSessionInput {
  wpm: number;
  accuracy: number;
  backspaces: number;
  mistakes: string[];
}

export interface TypingSession {
  _id: string;
  date: string;
  wpm: number;
  accuracy: number;
  backspaces: number;
  mistakes: string[];
}

export interface CreateSessionResponse {
  session: TypingSession;
  newMilestones: Milestone[];
}

export async function createSession(
  body: CreateSessionInput,
): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as CreateSessionResponse;
}

export async function fetchSessions(): Promise<TypingSession[]> {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as TypingSession[];
}

export interface AnalyticsSummary {
  currentWpm: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalSessions: number;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_URL}/analytics/summary`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as AnalyticsSummary;
}

export interface Milestone {
  type: string;
  value: number;
  achievedAt: string;
}

export interface LearningProfile {
  userId: string;
  currentWpm: number;
  bestWpm: number;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  primaryWeaknesses: string[];
  strengths: string[];
  milestones: Milestone[];
  learningStyle: string | null;
  plateauDetected: boolean;
  updatedAt: string;
}

export async function fetchLearningProfile(): Promise<LearningProfile> {
  const response = await fetch(`${API_URL}/learning-profile`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as LearningProfile;
}


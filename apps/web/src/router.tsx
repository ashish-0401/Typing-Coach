import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { HealthPage } from './pages/HealthPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TypingTestPage } from './pages/TypingTestPage';
import { LandingPage } from './pages/LandingPage';
import { LearningProfilePage } from './pages/LearningProfilePage';
import { CoachPage } from './pages/CoachPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/practice', element: <TypingTestPage /> },
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/profile',
        element: (
          <RequireAuth>
            <LearningProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: '/coach',
        element: (
          <RequireAuth>
            <CoachPage />
          </RequireAuth>
        ),
      },
      {
        path: '/exercises',
        element: (
          <RequireAuth>
            <ExercisesPage />
          </RequireAuth>
        ),
      },
      {
        path: '/settings',
        element: (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        ),
      },
      // Developer/internal routes (not in the main nav).
      { path: '/style-guide', element: <StyleGuidePage /> },
      { path: '/health', element: <HealthPage /> },
    ],
  },
]);

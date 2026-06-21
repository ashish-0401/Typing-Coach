import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { HealthPage } from './pages/HealthPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TypingTestPage } from './pages/TypingTestPage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { LearningProfilePage } from './pages/LearningProfilePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <TypingTestPage /> },
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/history',
        element: (
          <RequireAuth>
            <SessionHistoryPage />
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
      // Developer/internal routes (not in the main nav).
      { path: '/style-guide', element: <StyleGuidePage /> },
      { path: '/health', element: <HealthPage /> },
    ],
  },
]);

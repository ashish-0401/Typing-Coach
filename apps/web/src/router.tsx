import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { HealthPage } from './pages/HealthPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TypingTestPage } from './pages/TypingTestPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <StyleGuidePage /> },
      { path: '/health', element: <HealthPage /> },
      { path: '/typing', element: <TypingTestPage /> },
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

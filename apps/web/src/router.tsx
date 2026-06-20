import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { HealthPage } from './pages/HealthPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <StyleGuidePage /> },
      { path: '/health', element: <HealthPage /> },
    ],
  },
]);

import { createBrowserRouter, Navigate } from 'react-router-dom';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Dashboard Layout and Pages
import { DashboardLayout } from '@/layouts';
import StartPage from '@/pages/Dashboard/StartPage';
import FavoritesPage from '@/pages/Dashboard/FavoritesPage';
import TrashPage from '@/pages/Dashboard/TrashPage';
import TemplatesPage from '@/pages/Dashboard/TemplatesPage';
import SettingsPage from '@/pages/Dashboard/SettingsPage';

// 路由守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="start" replace />,
      },
      {
        path: 'start',
        element: <StartPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'trash',
        element: <TrashPage />,
      },
      {
        path: 'templates',
        element: <TemplatesPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export default router;

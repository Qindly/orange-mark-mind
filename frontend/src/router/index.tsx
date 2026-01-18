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

// Knowledge Base Pages
import KnowledgeBase from '@/pages/KnowledgeBase';
import DocumentView from '@/pages/KnowledgeBase/DocumentView';

// 路由守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 404 页面
const NotFound = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    gap: '16px'
  }}>
    <h1 style={{ fontSize: '48px', margin: 0 }}>404</h1>
    <p style={{ color: '#666' }}>页面不存在</p>
    <a href="/dashboard" style={{ color: '#F5A623' }}>返回首页</a>
  </div>
);

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
  // 知识库路由 - 直接使用完整 ID
  // URL: /kb-1 或 /kb-1/doc-1
  {
    path: '/:folderId',
    element: (
      <ProtectedRoute>
        <KnowledgeBase />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ':docId',
        element: <DocumentView />,
      },
    ],
  },
  // 404 兜底路由
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;

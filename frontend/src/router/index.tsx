import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layout 组件保持同步导入（它们是骨架，需要立即渲染）
import { DashboardLayout, AdminLayout } from '@/layouts';

// 页面级组件懒加载
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Admin = lazy(() => import('@/pages/Admin'));
const StartPage = lazy(() => import('@/pages/Dashboard/StartPage'));
const FavoritesPage = lazy(() => import('@/pages/Dashboard/FavoritesPage'));
const TrashPage = lazy(() => import('@/pages/Dashboard/TrashPage'));
const TemplatesPage = lazy(() => import('@/pages/Dashboard/TemplatesPage'));
const SettingsPage = lazy(() => import('@/pages/Dashboard/SettingsPage'));
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'));
const DocumentView = lazy(() => import('@/pages/KnowledgeBase/DocumentView'));

// 懒加载 fallback
const LazyFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    加载中...
  </div>
);

// Suspense 包裹器
const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LazyFallback />}>{children}</Suspense>
);

// 路由守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin 路由守卫组件
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
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
    element: <S><Home /></S>,
  },
  {
    path: '/login',
    element: <S><Login /></S>,
  },
  {
    path: '/register',
    element: <S><Register /></S>,
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
        element: <S><StartPage /></S>,
      },
      {
        path: 'favorites',
        element: <S><FavoritesPage /></S>,
      },
      {
        path: 'trash',
        element: <S><TrashPage /></S>,
      },
      {
        path: 'templates',
        element: <S><TemplatesPage /></S>,
      },
      {
        path: 'settings',
        element: <S><SettingsPage /></S>,
      },
    ],
  },
  // 管理面板路由（仅管理员可访问）
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <S><Admin /></S>,
      },
    ],
  },
  // 知识库路由 - 直接使用完整 ID
  // URL: /kb-1 或 /kb-1/doc-1
  {
    path: '/:folderId',
    element: (
      <ProtectedRoute>
        <S><KnowledgeBase /></S>
      </ProtectedRoute>
    ),
    children: [
      {
        path: ':docId',
        element: <S><DocumentView /></S>,
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

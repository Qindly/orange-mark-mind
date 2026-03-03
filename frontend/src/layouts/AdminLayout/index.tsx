import { useState } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import './AdminLayout.scss';

function AdminLayout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const user = useAuthStore((s) => s.user);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch {
            console.log('Logout API failed, but clearing local tokens');
        } finally {
            useAuthStore.getState().logout();
            navigate('/');
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="admin-layout">
            {/* 顶部导航栏 */}
            <header className="admin-layout__header">
                <div className="admin-layout__header-content">
                    <div className="admin-layout__header-left">
                        <Link to="/" className="admin-layout__brand">
                            <span className="admin-layout__logo-icon">🍊</span>
                            <span className="admin-layout__logo-text">Orange Mark Mind</span>
                        </Link>
                        <span className="admin-layout__divider">|</span>
                        <span className="admin-layout__title">管理面板</span>
                    </div>

                    <div className="admin-layout__header-right">
                        <button
                            className="admin-layout__back-btn"
                            onClick={handleBackToDashboard}
                        >
                            ← 返回控制台
                        </button>
                        {user && (
                            <div className="admin-layout__user">
                                <span className="admin-layout__user-avatar">
                                    {user.avatar || user.nickname?.charAt(0) || user.username.charAt(0)}
                                </span>
                                <span className="admin-layout__user-name">
                                    {user.nickname || user.username}
                                </span>
                            </div>
                        )}
                        <button
                            className="admin-layout__logout-btn"
                            onClick={handleLogout}
                            disabled={loading}
                        >
                            {loading ? '退出中...' : '退出登录'}
                        </button>
                    </div>
                </div>
            </header>

            {/* 内容区 */}
            <main className="admin-layout__content">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;

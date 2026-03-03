import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import Sidebar from '@/layouts/Sidebar';
import { Modal, SettingsPanel, ChangePasswordModal } from '@/components';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { useClickOutside } from '@/hooks';
import './DashboardLayout.scss';

function DashboardLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useClickOutside(dropdownRef, useCallback(() => setShowDropdown(false), []));

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

  const handleAdminPanel = () => {
    setShowDropdown(false);
    navigate('/admin');
  };

  const handleSettings = () => {
    setShowDropdown(false);
    setShowSettings(true);
  };

  return (
    <div className="dashboard-layout">
      {/* A 部分：顶部导航栏 */}
      <header className="dashboard-layout__header">
        <div className="dashboard-layout__header-content">
          <Link to="/" className="dashboard-layout__brand">
            <span className="dashboard-layout__logo-icon">🍊</span>
            <span className="dashboard-layout__logo-text">Orange Mark Mind</span>
          </Link>

          <div className="dashboard-layout__header-right">
            {user && (
              <div className="dashboard-layout__user-wrapper" ref={dropdownRef}>
                <div
                  className="dashboard-layout__user"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className="dashboard-layout__user-avatar">
                    {user.avatar || user.nickname?.charAt(0) || user.username.charAt(0)}
                  </span>
                  <span className="dashboard-layout__user-name">
                    {user.nickname || user.username}
                  </span>
                  <span className="dashboard-layout__user-arrow">
                    {showDropdown ? '▲' : '▼'}
                  </span>
                </div>

                {showDropdown && (
                  <div className="dashboard-layout__dropdown">
                    {isAdmin && (
                      <button
                        className="dashboard-layout__dropdown-item"
                        onClick={handleAdminPanel}
                      >
                        管理面板
                      </button>
                    )}
                    <button
                      className="dashboard-layout__dropdown-item"
                      onClick={handleSettings}
                    >
                      设置
                    </button>
                    <button
                      className="dashboard-layout__dropdown-item dashboard-layout__dropdown-item--danger"
                      onClick={handleLogout}
                      disabled={loading}
                    >
                      {loading ? '退出中...' : '退出登录'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* B 部分：左右布局 */}
      <div className="dashboard-layout__body">
        {/* C 部分：侧边栏 */}
        <Sidebar />

        {/* D 部分：内容区 - 使用 Outlet 渲染子路由 */}
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="设置"
        width={560}
      >
        <SettingsPanel
          onChangePassword={() => {
            setShowSettings(false);
            setShowChangePassword(true);
          }}
        />
      </Modal>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

export default DashboardLayout;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import type { MenuKey } from '../Sidebar';
import { logout } from '../../api/auth';
import type { UserInfo } from '../../types';
import './DashboardLayout.scss';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenu?: MenuKey;
  onMenuChange?: (key: MenuKey) => void;
}

function DashboardLayout({ children, activeMenu, onMenuChange }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 从 localStorage 获取用户信息
  const getUserInfo = (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch {
        return null;
      }
    }
    return null;
  };
  
  const user = getUserInfo();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch {
      console.log('Logout API failed, but clearing local tokens');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      navigate('/');
    }
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
              <div className="dashboard-layout__user">
                <span className="dashboard-layout__user-avatar">
                  {user.avatar || user.nickname?.charAt(0) || user.username.charAt(0)}
                </span>
                <span className="dashboard-layout__user-name">
                  {user.nickname || user.username}
                </span>
              </div>
            )}
            <button 
              className="dashboard-layout__logout-btn"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? '退出中...' : '退出登录'}
            </button>
          </div>
        </div>
      </header>
      
      {/* B 部分：左右布局 */}
      <div className="dashboard-layout__body">
        {/* C 部分：侧边栏 */}
        <Sidebar activeMenu={activeMenu} onMenuChange={onMenuChange} />
        
        {/* D 部分：内容区 */}
        <main className="dashboard-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

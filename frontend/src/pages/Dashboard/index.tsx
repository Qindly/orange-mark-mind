import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../../api/auth';
import type { UserInfo } from '../../types';
import './Dashboard.scss';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch {
        localStorage.removeItem('user_info');
        navigate('/login');
      }
    }
  }, [navigate]);

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
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="container dashboard__header-content">
          <Link to="/" className="dashboard__brand">
            <span className="dashboard__logo-icon">🍊</span>
            <span className="dashboard__logo-text">Orange Mark Mind</span>
          </Link>
          <div className="dashboard__user">
            {user && (
              <span className="dashboard__user-name">
                👋 欢迎, {user.nickname || user.username}
              </span>
            )}
            <button 
              className="btn btn-outline"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? '退出中...' : '退出登录'}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard__main">
        <div className="container">
          <div className="welcome-card card">
            <h1>🎉 欢迎来到 Orange Mark Mind!</h1>
            <p>您已成功登录。这是一个占位页面，后续会添加更多功能。</p>
            
            {user && (
              <div className="user-info">
                <h3>用户信息</h3>
                <ul>
                  <li><strong>ID:</strong> {user.id}</li>
                  <li><strong>用户名:</strong> {user.username}</li>
                  <li><strong>邮箱:</strong> {user.email}</li>
                  <li><strong>昵称:</strong> {user.nickname || '-'}</li>
                  <li><strong>角色:</strong> {user.role}</li>
                  <li><strong>状态:</strong> {user.status}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

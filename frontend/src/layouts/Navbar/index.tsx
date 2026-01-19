import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.scss';

interface NavbarProps {
  showAuthButton?: boolean;
}

function Navbar({ showAuthButton = true }: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <header className="navbar">
      <div className="container navbar__content">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo-icon">🍊</span>
          <span className="navbar__logo-text">Orange Mark Mind</span>
        </Link>
        
        <nav className="navbar__nav">
          <a href="#features">功能介绍</a>
          <a href="#about">关于我们</a>
        </nav>
        
        {showAuthButton && (
          <div className="navbar__actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn btn-primary">
                控制台
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary">
                登录 / 注册
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

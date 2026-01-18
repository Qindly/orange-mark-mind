import { Link } from 'react-router-dom';
import './AuthCard.scss';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Logo */}
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="auth-logo__icon">🍊</span>
            <span className="auth-logo__text">Orange Mark Mind</span>
          </Link>
        </div>

        {/* 内容卡片 */}
        <div className="auth-card card">
          <h2 className="auth-card__title">{title}</h2>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
          {footer && <div className="auth-card__footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AuthCard;

import { useNavigate, useLocation } from 'react-router-dom';
import './SidebarFooter.scss';

function SidebarFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === '/dashboard/settings';

  return (
    <div className="sidebar-footer">
      <div 
        className={`sidebar-footer__item ${isActive ? 'active' : ''}`}
        onClick={() => navigate('/dashboard/settings')}
      >
        <span className="sidebar-footer__icon">⚙️</span>
        <span className="sidebar-footer__text">设置</span>
      </div>
    </div>
  );
}

export default SidebarFooter;

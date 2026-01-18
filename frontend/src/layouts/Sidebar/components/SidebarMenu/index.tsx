import { useNavigate, useLocation } from 'react-router-dom';
import './SidebarMenu.scss';

interface MenuItem {
  key: string;
  icon: string;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'start', icon: '🏠', label: '开始', path: '/dashboard/start' },
  { key: 'favorites', icon: '⭐', label: '收藏', path: '/dashboard/favorites' },
  { key: 'trash', icon: '🗑️', label: '回收站', path: '/dashboard/trash' },
  { key: 'templates', icon: '📋', label: '模板', path: '/dashboard/templates' },
];

function SidebarMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sidebar-menu">
      {menuItems.map(item => (
        <div 
          key={item.key}
          className={`sidebar-menu__item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="sidebar-menu__icon">{item.icon}</span>
          <span className="sidebar-menu__text">{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

export default SidebarMenu;

import { useNavigate, useLocation } from 'react-router-dom';
import './SidebarMenu.scss';

interface MenuItem {
  key: string;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  // TODO: AI 对话功能暂时禁用，待后续版本完善后启用
  // 相关代码已实现，包括：流式输出、RAG 文档引用、上下文设置等
  // 启用时取消下行注释即可
  // { key: 'conversations', label: '对话', path: '/dashboard/conversations' },
  { key: 'start', label: '开始', path: '/dashboard/start' },
  { key: 'favorites', label: '收藏', path: '/dashboard/favorites' },
  { key: 'trash', label: '回收站', path: '/dashboard/trash' },
  { key: 'templates', label: '模板', path: '/dashboard/templates' },
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
          <span className="sidebar-menu__text">{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

export default SidebarMenu;

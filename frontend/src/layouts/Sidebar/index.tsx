import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFolders } from '../../api/documents';
import type { Folder } from '../../types';
import './Sidebar.scss';

// 侧边栏菜单项类型
type MenuKey = 'start' | 'favorites' | 'trash' | 'templates' | 'settings';

interface SidebarProps {
  activeMenu?: MenuKey;
  onMenuChange?: (key: MenuKey) => void;
}

function Sidebar({ activeMenu = 'start', onMenuChange }: SidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetchFolders();
      if (res.code === 0) {
        setFolders(res.data);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleMenuClick = (key: MenuKey) => {
    onMenuChange?.(key);
  };

  // 拖拽调整宽度
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth >= 180 && newWidth <= 400) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar ${isResizing ? 'sidebar--resizing' : ''}`}
      style={{ width: sidebarWidth }}
    >
      {/* 顶部区域：搜索 + 新建按钮 + 菜单 */}
      <div className="sidebar__top">
        {/* 搜索框 + 新建按钮 */}
        <div className="sidebar__header">
          <div className="sidebar__search">
            <span className="sidebar__search-icon">🔍</span>
            <input 
              type="text" 
              className="sidebar__search-input" 
              placeholder="搜索"
            />
          </div>
          <button className="sidebar__new-btn" title="新建文档">+</button>
        </div>

        {/* 主菜单 */}
        <nav className="sidebar__menu">
          <div 
            className={`sidebar__menu-item ${activeMenu === 'start' ? 'active' : ''}`}
            onClick={() => handleMenuClick('start')}
          >
            <span className="sidebar__menu-icon">🏠</span>
            <span className="sidebar__menu-text">开始</span>
          </div>
          
          <div 
            className={`sidebar__menu-item ${activeMenu === 'favorites' ? 'active' : ''}`}
            onClick={() => handleMenuClick('favorites')}
          >
            <span className="sidebar__menu-icon">⭐</span>
            <span className="sidebar__menu-text">收藏</span>
          </div>
          
          <div 
            className={`sidebar__menu-item ${activeMenu === 'trash' ? 'active' : ''}`}
            onClick={() => handleMenuClick('trash')}
          >
            <span className="sidebar__menu-icon">🗑️</span>
            <span className="sidebar__menu-text">回收站</span>
          </div>

          <div 
            className={`sidebar__menu-item ${activeMenu === 'templates' ? 'active' : ''}`}
            onClick={() => handleMenuClick('templates')}
          >
            <span className="sidebar__menu-icon">📋</span>
            <span className="sidebar__menu-text">模板</span>
          </div>
        </nav>
      </div>

      {/* 中间区域：知识库列表（填充剩余空间） */}
      <div className="sidebar__middle">
        <div className="sidebar__divider">
          <span className="sidebar__divider-text">知识库</span>
          <button className="sidebar__add-btn" title="新建知识库">+</button>
        </div>
        <div className="sidebar__folders">
          {folders.map(folder => (
            <div 
              key={folder.id} 
              className="sidebar__folder"
            >
              <span className="sidebar__folder-icon">📁</span>
              <span className="sidebar__folder-name">{folder.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部区域：设置 */}
      <div className="sidebar__bottom">
        <div 
          className={`sidebar__menu-item ${activeMenu === 'settings' ? 'active' : ''}`}
          onClick={() => handleMenuClick('settings')}
        >
          <span className="sidebar__menu-icon">⚙️</span>
          <span className="sidebar__menu-text">设置</span>
        </div>
      </div>

      {/* 拖拽调整宽度的手柄 */}
      <div 
        className="sidebar__resizer"
        onMouseDown={startResizing}
      />
    </aside>
  );
}

export default Sidebar;
export type { MenuKey };

import { useState, useRef, useCallback, useEffect } from 'react';
import { SidebarSearch, SidebarMenu, SidebarFolders, SidebarFooter } from './components';
import './Sidebar.scss';

function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

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

  const handleNewDocument = () => {
    // TODO: 打开新建文档弹窗
    console.log('New document');
  };

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar ${isResizing ? 'sidebar--resizing' : ''}`}
      style={{ width: sidebarWidth }}
    >
      <div className="sidebar__top">
        <SidebarSearch onNewDocument={handleNewDocument} />
        <SidebarMenu />
      </div>

      <SidebarFolders />

      <SidebarFooter />

      <div 
        className="sidebar__resizer"
        onMouseDown={startResizing}
      />
    </aside>
  );
}

export default Sidebar;

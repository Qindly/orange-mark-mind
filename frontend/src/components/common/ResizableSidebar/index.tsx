import { useState, useRef, useCallback, useEffect } from 'react';
import './ResizableSidebar.scss';

interface ResizableSidebarProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

function ResizableSidebar({ 
  children, 
  minWidth = 200, 
  maxWidth = 400, 
  defaultWidth = 240 
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

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
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    }
  }, [isResizing, minWidth, maxWidth]);

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
      className={`resizable-sidebar ${isResizing ? 'resizable-sidebar--resizing' : ''}`}
      style={{ width }}
    >
      <div className="resizable-sidebar__content">
        {children}
      </div>
      <div 
        className="resizable-sidebar__resizer"
        onMouseDown={startResizing}
      />
    </aside>
  );
}

export default ResizableSidebar;

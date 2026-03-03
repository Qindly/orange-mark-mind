import { useResizable } from '@/hooks';
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
  const { width, isResizing, ref: sidebarRef, startResizing } = useResizable({ minWidth, maxWidth, defaultWidth });

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

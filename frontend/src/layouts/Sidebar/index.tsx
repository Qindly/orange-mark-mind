import { useState, useRef, useCallback, useEffect } from 'react';
import { SidebarSearch, SidebarMenu, SidebarFolders, SidebarFooter } from './components';
import { CreateDocumentModal, CreateFolderModal } from '@/components';
import { createFolder } from '@/api/folders';
import './Sidebar.scss';

function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderRefreshTrigger, setFolderRefreshTrigger] = useState(0);
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
    setIsDocModalOpen(true);
  };

  const handleCreateFolder = () => {
    setIsFolderModalOpen(true);
  };

  const handleDocumentConfirm = (folderId: string) => {
    // TODO: 创建文档并跳转到编辑页
    console.log('Create document in folder:', folderId);
  };

  const handleFolderConfirm = async (name: string, description: string) => {
    try {
      const res = await createFolder({ name, description: description || undefined });
      if (res.code === 0) {
        // 创建成功，刷新知识库列表
        setFolderRefreshTrigger(prev => prev + 1);
      } else {
        console.error('创建知识库失败:', res.message);
      }
    } catch (error) {
      console.error('创建知识库失败:', error);
    }
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`sidebar ${isResizing ? 'sidebar--resizing' : ''}`}
        style={{ width: sidebarWidth }}
      >
        <div className="sidebar__top">
          <SidebarSearch onNewDocument={handleNewDocument} />
          <SidebarMenu />
        </div>

        <SidebarFolders
          onAddFolder={handleCreateFolder}
          refreshTrigger={folderRefreshTrigger}
        />

        <SidebarFooter />

        <div
          className="sidebar__resizer"
          onMouseDown={startResizing}
        />
      </aside>

      <CreateDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onCreateFolder={handleCreateFolder}
        onConfirm={handleDocumentConfirm}
      />

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onConfirm={handleFolderConfirm}
      />
    </>
  );
}

export default Sidebar;

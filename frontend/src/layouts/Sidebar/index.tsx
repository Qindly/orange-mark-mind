import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarSearch, SidebarMenu, SidebarFolders, ConversationList } from './components';
import { CreateDocumentModal, CreateFolderModal } from '@/components';
import { createFolder } from '@/api/folders';
import { createDocument } from '@/api/documents';
import './Sidebar.scss';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderRefreshTrigger, setFolderRefreshTrigger] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);

  // Determine if we're in conversation mode based on route
  const isConversationMode = location.pathname.startsWith('/dashboard/conversations');

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

  const handleDocumentConfirm = async (folderId: string) => {
    try {
      const res = await createDocument({ title: '无标题文档', folder_id: folderId });
      if (res.code === 0) {
        // 创建成功，跳转到文档编辑页
        navigate(`/${folderId}/${res.data.id}`);
      } else {
        console.error('创建文档失败:', res.message);
      }
    } catch (error) {
      console.error('创建文档失败:', error);
    }
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
          {!isConversationMode && (
            <SidebarSearch onNewDocument={handleNewDocument} />
          )}
          <SidebarMenu />
        </div>

        {isConversationMode ? (
          <ConversationList />
        ) : (
          <SidebarFolders
            onAddFolder={handleCreateFolder}
            refreshTrigger={folderRefreshTrigger}
          />
        )}

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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarSearch, SidebarMenu, SidebarFolders } from './components';
import { CreateDocumentModal, CreateFolderModal } from '@/components';
import { createFolder } from '@/api/folders';
import { createDocument } from '@/api/documents';
import { useResizable } from '@/hooks';
import './Sidebar.scss';

function Sidebar() {
  const navigate = useNavigate();
  const { width, isResizing, ref: sidebarRef, startResizing } = useResizable({ minWidth: 180, maxWidth: 400, defaultWidth: 220 });
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderRefreshTrigger, setFolderRefreshTrigger] = useState(0);

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
        style={{ width }}
      >
        <div className="sidebar__top">
          <SidebarSearch onNewDocument={handleNewDocument} />
          <SidebarMenu />
        </div>

        <SidebarFolders
          onAddFolder={handleCreateFolder}
          refreshTrigger={folderRefreshTrigger}
        />

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

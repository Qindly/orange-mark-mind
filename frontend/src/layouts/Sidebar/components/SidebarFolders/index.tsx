import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFolders, updateFolder } from "@/api/folders";
import { EditFolderModal } from "@/components";
import type { Folder } from "@/types";
import "./SidebarFolders.scss";

interface SidebarFoldersProps {
  onAddFolder?: () => void;
  refreshTrigger?: number;
}

function SidebarFolders({ onAddFolder, refreshTrigger }: SidebarFoldersProps) {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetchFolders();
      if (res.code === 0) {
        setFolders(res.data);
      }
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // 监听 refreshTrigger 变化来刷新列表
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadFolders();
    }
  }, [refreshTrigger, loadFolders]);

  const handleFolderClick = (folder: Folder) => {
    navigate(`/${folder.id}`);
  };

  const handleEditClick = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation(); // 阻止触发文件夹点击事件
    setEditingFolder(folder);
    setIsEditModalOpen(true);
  };

  const handleSaveFolder = async (name: string, description: string) => {
    if (!editingFolder) return;

    const res = await updateFolder(editingFolder.id, { name, description: description || undefined });
    if (res.code === 0) {
      // 更新本地列表
      setFolders(prev => prev.map(f =>
        f.id === editingFolder.id ? { ...f, name, description } : f
      ));
    } else {
      throw new Error(res.message);
    }
  };

  const handleDeleteFolder = () => {
    // TODO: 实现删除知识库功能
    console.log('Delete folder - not implemented yet');
  };

  return (
    <>
      <div className="sidebar-folders">
        <div className="sidebar-folders__header">
          <span className="sidebar-folders__title">知识库</span>
          <button
            className="sidebar-folders__add-btn"
            title="新建知识库"
            onClick={onAddFolder}
          >
            +
          </button>
        </div>
        <div className="sidebar-folders__list">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="sidebar-folders__item"
              onClick={() => handleFolderClick(folder)}
            >
              <span className="sidebar-folders__icon">📁</span>
              <span className="sidebar-folders__name">{folder.name}</span>
              <button
                className="sidebar-folders__more"
                title="编辑知识库"
                onClick={(e) => handleEditClick(e, folder)}
              >
                •••
              </button>
            </div>
          ))}
        </div>
      </div>

      <EditFolderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        folder={editingFolder}
        onSave={handleSaveFolder}
        onDelete={handleDeleteFolder}
      />
    </>
  );
}

export default SidebarFolders;

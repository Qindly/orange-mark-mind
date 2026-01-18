import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFolders } from '@/api/documents';
import type { Folder } from '@/types';
import './SidebarFolders.scss';

function SidebarFolders() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);

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

  const handleFolderClick = (folder: Folder) => {
    navigate(`/${folder.id}`);
  };

  return (
    <div className="sidebar-folders">
      <div className="sidebar-folders__header">
        <span className="sidebar-folders__title">知识库</span>
        <button className="sidebar-folders__add-btn" title="新建知识库">+</button>
      </div>
      <div className="sidebar-folders__list">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className="sidebar-folders__item"
            onClick={() => handleFolderClick(folder)}
          >
            <span className="sidebar-folders__icon">📁</span>
            <span className="sidebar-folders__name">{folder.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SidebarFolders;

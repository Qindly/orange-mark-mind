import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import { fetchFolders } from '@/api/documents';
import type { Folder } from '@/types';
import './CreateDocumentModal.scss';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: () => void;
  onConfirm: (folderId: string) => void;
}

function CreateDocumentModal({ 
  isOpen, 
  onClose, 
  onCreateFolder,
  onConfirm 
}: CreateDocumentModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await fetchFolders();
      if (res.code === 0) {
        setFolders(res.data);
        // 默认选中第一个文件夹
        if (res.data.length > 0 && selectedFolderId === null) {
          setSelectedFolderId(res.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedFolderId !== null) {
      onConfirm(selectedFolderId);
      onClose();
    }
  };

  const handleCreateFolder = () => {
    onClose();
    onCreateFolder();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建文档" width={420}>
      <div className="create-document-modal">
        <p className="create-document-modal__subtitle">选择一个知识库</p>
        
        {loading ? (
          <div className="create-document-modal__loading">加载中...</div>
        ) : (
          <div className="create-document-modal__folders">
            {folders.map(folder => (
              <div
                key={folder.id}
                className={`create-document-modal__folder ${selectedFolderId === folder.id ? 'selected' : ''}`}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <span className="create-document-modal__folder-icon">📁</span>
                <span className="create-document-modal__folder-name">
                  Qindy / {folder.name}
                </span>
                <span className="create-document-modal__folder-lock">🔒</span>
              </div>
            ))}
          </div>
        )}

        <button 
          className="create-document-modal__add-folder"
          onClick={handleCreateFolder}
        >
          <span>+</span> 新建知识库
        </button>

        <div className="create-document-modal__actions">
          <button 
            className="btn btn-primary btn-block"
            onClick={handleConfirm}
            disabled={selectedFolderId === null}
          >
            确定
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateDocumentModal;

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import './CreateFolderModal.scss';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description: string) => void;
}

function CreateFolderModal({ isOpen, onClose, onConfirm }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('请输入知识库名称');
      return;
    }
    onConfirm(name.trim(), description.trim());
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="新建知识库" width={480}>
      <div className="create-folder-modal">
        <div className="create-folder-modal__section">
          <h4 className="create-folder-modal__label">基本信息</h4>
          
          <div className="create-folder-modal__input-group">
            <span className="create-folder-modal__icon">📁</span>
            <input
              type="text"
              className="create-folder-modal__input"
              placeholder="知识库名称"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setError('');
              }}
              autoFocus
            />
          </div>
          
          {error && <div className="create-folder-modal__error">{error}</div>}
          
          <textarea
            className="create-folder-modal__textarea"
            placeholder="知识库简介（选填）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <button 
          className="btn btn-primary btn-block create-folder-modal__submit"
          onClick={handleSubmit}
        >
          新建
        </button>
      </div>
    </Modal>
  );
}

export default CreateFolderModal;

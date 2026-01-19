import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import './EditFolderModal.scss';

interface EditFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder: { id: string; name: string; description?: string } | null;
    onSave: (name: string, description: string) => Promise<void>;
    onDelete?: () => void;
}

function EditFolderModal({ isOpen, onClose, folder, onSave, onDelete }: EditFolderModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // 当 folder 变化或弹窗打开时，重置表单
    useEffect(() => {
        if (isOpen && folder) {
            setName(folder.name || '');
            setDescription(folder.description || '');
            setError('');
        }
    }, [isOpen, folder]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('请输入知识库名称');
            return;
        }

        setSaving(true);
        try {
            await onSave(name.trim(), description.trim());
            onClose();
        } catch (err) {
            setError('保存失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="编辑知识库" width={480}>
            <div className="edit-folder-modal">
                <div className="edit-folder-modal__section">
                    <label className="edit-folder-modal__label">知识库名称</label>
                    <div className="edit-folder-modal__input-group">
                        <span className="edit-folder-modal__icon">📁</span>
                        <input
                            type="text"
                            className="edit-folder-modal__input"
                            placeholder="知识库名称"
                            value={name}
                            onChange={e => {
                                setName(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                    {error && <div className="edit-folder-modal__error">{error}</div>}
                </div>

                <div className="edit-folder-modal__section">
                    <label className="edit-folder-modal__label">知识库简介</label>
                    <textarea
                        className="edit-folder-modal__textarea"
                        placeholder="知识库简介（选填）"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="edit-folder-modal__actions">
                    <button
                        className="btn btn-outline btn-danger"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        删除
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default EditFolderModal;

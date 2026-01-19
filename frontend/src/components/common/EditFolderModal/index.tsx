import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import './EditFolderModal.scss';

interface EditFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder: { id: string; name: string; description?: string } | null;
    onSave: (name: string, description: string) => Promise<void>;
    onDelete?: () => Promise<void>;
}

function EditFolderModal({ isOpen, onClose, folder, onSave, onDelete }: EditFolderModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 当 folder 变化或弹窗打开时，重置表单
    useEffect(() => {
        if (isOpen && folder) {
            setName(folder.name || '');
            setDescription(folder.description || '');
            setError('');
            setShowDeleteConfirm(false);
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

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    const handleDeleteConfirm = async () => {
        if (!onDelete) return;

        setDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (err) {
            setError('删除失败，请稍后重试');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="编辑知识库" width={480}>
            <div className="edit-folder-modal">
                {showDeleteConfirm ? (
                    // 删除确认界面
                    <div className="edit-folder-modal__confirm">
                        <h3 className="edit-folder-modal__confirm-title">确定要删除吗？</h3>
                        <p className="edit-folder-modal__confirm-text">
                            删除知识库「{folder?.name}」后，其中的所有文档也将被删除，此操作不可恢复。
                        </p>
                        <div className="edit-folder-modal__confirm-actions">
                            <button
                                className="btn btn-outline"
                                onClick={handleDeleteCancel}
                                disabled={deleting}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? '删除中...' : '确认删除'}
                            </button>
                        </div>
                    </div>
                ) : (
                    // 编辑界面
                    <>
                        <div className="edit-folder-modal__section">
                            <label className="edit-folder-modal__label">知识库名称</label>
                            <div className="edit-folder-modal__input-group">
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
                                onClick={handleDeleteClick}
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
                    </>
                )}
            </div>
        </Modal>
    );
}

export default EditFolderModal;

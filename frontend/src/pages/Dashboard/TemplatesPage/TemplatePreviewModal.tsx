import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, MarkdownRenderer } from '@/components';
import { fetchFolders } from '@/api/folders';
import { useTemplate } from '@/api/templates';
import type { Template } from '@/types/template';
import type { Folder } from '@/types';
import './TemplatePreviewModal.scss';

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template | null;
}

function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
    const navigate = useNavigate();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            setTitle(template?.name || '');
            setError('');
        }
    }, [isOpen, template]);

    const loadFolders = async () => {
        try {
            const res = await fetchFolders(true);
            if (res.code === 0 && res.data) {
                setFolders(res.data);
                if (res.data.length > 0) {
                    setSelectedFolderId(res.data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load folders:', err);
        }
    };

    const handleUseTemplate = async () => {
        if (!template || !selectedFolderId) {
            setError('请选择知识库');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await useTemplate(template.id, {
                title: title || template.name,
                folder_id: selectedFolderId,
            });

            if (res.code === 0 && res.data) {
                onClose();
                // 跳转到新创建的文档
                navigate(`/${selectedFolderId}/${res.data.id}`);
            } else {
                setError(res.message || '创建失败');
            }
        } catch (err) {
            setError('创建文档失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    if (!template) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="使用模板" width={720}>
            <div className="template-preview-modal">
                <div className="template-preview-modal__preview">
                    <h4 className="template-preview-modal__preview-title">模板预览</h4>
                    <div className="template-preview-modal__content">
                        <MarkdownRenderer content={template.content || ''} />
                    </div>
                </div>

                <div className="template-preview-modal__form">
                    <div className="template-preview-modal__field">
                        <label>文档标题</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={template.name}
                        />
                    </div>

                    <div className="template-preview-modal__field">
                        <label>选择知识库</label>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                        >
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="template-preview-modal__error">{error}</p>}

                    <div className="template-preview-modal__actions">
                        <button
                            className="template-preview-modal__btn template-preview-modal__btn--secondary"
                            onClick={onClose}
                        >
                            取消
                        </button>
                        <button
                            className="template-preview-modal__btn template-preview-modal__btn--primary"
                            onClick={handleUseTemplate}
                            disabled={loading || !selectedFolderId}
                        >
                            {loading ? '创建中...' : '使用此模板'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default TemplatePreviewModal;

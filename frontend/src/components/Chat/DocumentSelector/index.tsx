import { useState, useEffect } from 'react';
import { fetchFolders } from '@/api/folders';
import { fetchDocumentsByFolder } from '@/api/documents';
import type { Folder, Document } from '@/types';
import './DocumentSelector.scss';

export interface SelectedDocument {
    id: string;
    title: string;
}

interface DocumentSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (docs: SelectedDocument[]) => void;
    selectedDocs: SelectedDocument[];
}

function DocumentSelector({ isOpen, onClose, onSelect, selectedDocs }: DocumentSelectorProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedDocs.map(d => d.id)));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            setSelected(new Set(selectedDocs.map(d => d.id)));
        }
    }, [isOpen, selectedDocs]);

    useEffect(() => {
        if (selectedFolder) {
            loadDocuments(selectedFolder);
        } else {
            setDocuments([]);
        }
    }, [selectedFolder]);

    const loadFolders = async () => {
        try {
            const res = await fetchFolders(true);
            if (res.code === 0 && res.data) {
                setFolders(res.data);
            }
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    };

    const loadDocuments = async (folderId: string) => {
        setLoading(true);
        try {
            const res = await fetchDocumentsByFolder(folderId);
            if (res.code === 0 && res.data) {
                setDocuments(res.data);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDocument = (doc: Document) => {
        const newSelected = new Set(selected);
        if (newSelected.has(doc.id)) {
            newSelected.delete(doc.id);
        } else {
            newSelected.add(doc.id);
        }
        setSelected(newSelected);
    };

    const handleConfirm = () => {
        const selectedItems = documents
            .filter(d => selected.has(d.id))
            .map(d => ({ id: d.id, title: d.title }));

        // Also include previously selected docs that aren't in current view
        const previouslySelected = selectedDocs.filter(d =>
            selected.has(d.id) && !documents.find(doc => doc.id === d.id)
        );

        onSelect([...previouslySelected, ...selectedItems]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="doc-selector-overlay" onClick={onClose}>
            <div className="doc-selector" onClick={e => e.stopPropagation()}>
                <header className="doc-selector__header">
                    <h3>选择文档</h3>
                    <button className="doc-selector__close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="doc-selector__content">
                    <aside className="doc-selector__folders">
                        <h4>知识库</h4>
                        <ul>
                            {folders.map(folder => (
                                <li
                                    key={folder.id}
                                    className={selectedFolder === folder.id ? 'active' : ''}
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    {folder.name}
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <div className="doc-selector__documents">
                        <h4>文档 {selected.size > 0 && `(已选 ${selected.size})`}</h4>
                        {loading ? (
                            <div className="doc-selector__loading">加载中...</div>
                        ) : documents.length === 0 ? (
                            <div className="doc-selector__empty">
                                {selectedFolder ? '该知识库暂无文档' : '请先选择知识库'}
                            </div>
                        ) : (
                            <ul>
                                {documents.map(doc => (
                                    <li
                                        key={doc.id}
                                        className={selected.has(doc.id) ? 'selected' : ''}
                                        onClick={() => toggleDocument(doc)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.has(doc.id)}
                                            onChange={() => toggleDocument(doc)}
                                        />
                                        <span>{doc.title}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <footer className="doc-selector__footer">
                    <button className="doc-selector__btn--cancel" onClick={onClose}>
                        取消
                    </button>
                    <button className="doc-selector__btn--confirm" onClick={handleConfirm}>
                        确认选择
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default DocumentSelector;

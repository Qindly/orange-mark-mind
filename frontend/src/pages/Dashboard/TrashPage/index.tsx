import { useState, useEffect, useCallback } from 'react';
import { DocumentItem, PageHeader, EmptyState, Modal } from '@/components';
import type { DocumentAction } from '@/components/common/DocumentItem';
import { fetchDeletedDocuments, restoreDocument, deleteDocument } from '@/api/documents';
import { formatDate } from '@/utils/format';
import type { Document } from '@/types';
import './TrashPage.scss';

function TrashPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeletedDocuments();
      if (res.code === 0) {
        setDocuments(res.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleRestore = async (docId: string) => {
    setRestoring(docId);
    try {
      const res = await restoreDocument(docId);
      if (res.code === 0) {
        // 从列表中移除已恢复的文档
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
      }
    } catch (error) {
      console.error('Failed to restore document:', error);
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteClick = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setDeleteConfirm(doc);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirm) return;

    const docId = deleteConfirm.id;
    setDeleting(docId);
    setDeleteConfirm(null);

    try {
      const res = await deleteDocument(docId, true);
      if (res.code === 0) {
        // 从列表中移除已永久删除的文档
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
      }
    } catch (error) {
      console.error('Failed to permanently delete document:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getActions = (docId: string): DocumentAction[] => [
    {
      key: 'restore',
      label: '恢复',
      icon: restoring === docId ? '...' : '↩',
      onClick: handleRestore,
    },
    {
      key: 'delete',
      label: '永久删除',
      icon: deleting === docId ? '...' : '✕',
      onClick: handleDeleteClick,
      danger: true,
    },
  ];

  return (
    <div className="trash-page">
      <PageHeader title="回收站" icon="🗑️" />

      <div className="trash-page__content">
        {loading ? (
          <div className="trash-page__loading">加载中...</div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon="🗑️"
            title="回收站为空"
            description="删除的文档会在这里保留 30 天"
          />
        ) : (
          <div className="trash-page__list">
            {documents.map(doc => (
              <DocumentItem
                key={doc.id}
                id={doc.id}
                title={doc.title}
                folderName={doc.folder_name}
                date={formatDate(doc.deleted_at || doc.updated_at)}
                actions={getActions(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 永久删除确认弹窗 */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认永久删除"
        width={400}
      >
        <div className="trash-page__confirm">
          <p className="trash-page__confirm-warning">
            确定要永久删除文档 <strong>「{deleteConfirm?.title}」</strong> 吗？
          </p>
          <p className="trash-page__confirm-tip">
            此操作不可恢复，文档将被彻底删除。
          </p>
          <div className="trash-page__confirm-actions">
            <button
              className="btn btn-outline"
              onClick={() => setDeleteConfirm(null)}
            >
              取消
            </button>
            <button
              className="btn btn-danger"
              onClick={handlePermanentDelete}
            >
              永久删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TrashPage;



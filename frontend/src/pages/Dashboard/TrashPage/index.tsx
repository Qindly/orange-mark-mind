import { useState, useEffect } from 'react';
import { DocumentItem, PageHeader, EmptyState } from '@/components';
import { fetchDeletedDocuments } from '@/api/documents';
import type { Document } from '@/types';
import './TrashPage.scss';

function TrashPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
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
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrashPage;

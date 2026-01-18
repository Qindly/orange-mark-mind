import { useState, useEffect } from 'react';
import { DocumentItem, PageHeader, EmptyState } from '@/components';
import { fetchFavoriteDocuments } from '@/api/documents';
import type { Document } from '@/types';
import './FavoritesPage.scss';

function FavoritesPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetchFavoriteDocuments();
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
    <div className="favorites-page">
      <PageHeader title="收藏" icon="⭐" />

      <div className="favorites-page__content">
        {loading ? (
          <div className="favorites-page__loading">加载中...</div>
        ) : documents.length === 0 ? (
          <EmptyState 
            icon="⭐" 
            title="暂无收藏" 
            description="点击文档右上角的星标即可收藏" 
          />
        ) : (
          <div className="favorites-page__list">
            {documents.map(doc => (
              <DocumentItem
                key={doc.id}
                id={doc.id}
                title={doc.title}
                folderName={doc.folder_name}
                date={formatDate(doc.updated_at)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;

import { useState, useEffect } from 'react';
import { ActionCard, DocumentItem, TabGroup, PageHeader } from '@/components';
import { fetchRecentDocuments } from '@/api/documents';
import type { Document } from '@/types';
import './StartPage.scss';

const documentTabs = [
  { key: 'edited', label: '编辑过' },
  { key: 'viewed', label: '浏览过' },
  { key: 'liked', label: '我点赞的' },
  { key: 'commented', label: '我评论过' },
];

function StartPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('edited');

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetchRecentDocuments();
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
    <div className="start-page">
      <PageHeader title="开始" />

      {/* 快捷操作 */}
      <section className="start-page__actions">
        <ActionCard 
          icon="📄" 
          title="新建文档" 
          description="文档、表格、画板、数据表" 
        />
        <ActionCard 
          icon="📚" 
          title="新建知识库" 
          description="使用知识库整理知识" 
        />
        <ActionCard 
          icon="🎨" 
          title="模板中心" 
          description="从模板中获取灵感" 
        />
      </section>

      {/* 文档列表 */}
      <section className="start-page__documents">
        <h2 className="start-page__section-title">文档</h2>
        <TabGroup 
          tabs={documentTabs} 
          defaultActiveKey="edited"
          onChange={setActiveTab}
        />
        
        <div className="start-page__doc-list">
          {loading ? (
            <div className="start-page__loading">加载中...</div>
          ) : documents.length === 0 ? (
            <div className="start-page__empty">暂无文档</div>
          ) : (
            documents.map(doc => (
              <DocumentItem
                key={doc.id}
                id={doc.id}
                title={doc.title}
                folderName={doc.folder_name}
                date={formatDate(doc.updated_at)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default StartPage;

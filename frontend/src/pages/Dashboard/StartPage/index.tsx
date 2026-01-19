import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard, DocumentItem, TabGroup, PageHeader, CreateDocumentModal, CreateFolderModal } from '@/components';
import { fetchRecentDocuments, createDocument } from '@/api/documents';
import { createFolder } from '@/api/folders';
import type { Document } from '@/types';
import './StartPage.scss';

const documentTabs = [
  { key: 'edited', label: '编辑过' },
  { key: 'viewed', label: '浏览过' },
  { key: 'liked', label: '我点赞的' },
  { key: 'commented', label: '我评论过' },
];

function StartPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('edited');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  // 监听知识库删除事件，刷新文档列表
  useEffect(() => {
    const handleFolderDeleted = () => {
      loadDocuments();
    };

    window.addEventListener('folder-deleted', handleFolderDeleted);
    return () => {
      window.removeEventListener('folder-deleted', handleFolderDeleted);
    };
  }, []);

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

  const handleNewDocument = () => {
    setIsDocModalOpen(true);
  };

  const handleNewFolder = () => {
    setIsFolderModalOpen(true);
  };

  const handleTemplates = () => {
    navigate('/dashboard/templates');
  };

  const handleDocumentConfirm = async (folderId: string) => {
    try {
      const res = await createDocument({ title: '无标题文档', folder_id: folderId });
      if (res.code === 0) {
        // 创建成功，跳转到文档编辑页
        navigate(`/${folderId}/${res.data.id}`);
      } else {
        console.error('创建文档失败:', res.message);
      }
    } catch (error) {
      console.error('创建文档失败:', error);
    }
  };

  const handleFolderConfirm = async (name: string, description: string) => {
    try {
      const res = await createFolder({ name, description: description || undefined });
      if (res.code === 0) {
        // 创建成功，跳转到新建的知识库
        navigate(`/${res.data.id}`);
      } else {
        console.error('创建知识库失败:', res.message);
      }
    } catch (error) {
      console.error('创建知识库失败:', error);
    }
  };

  const handleDocumentClick = (doc: Document) => {
    navigate(`/${doc.folder_id}/${doc.id}`);
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
          onClick={handleNewDocument}
        />
        <ActionCard
          icon="📚"
          title="新建知识库"
          description="使用知识库整理知识"
          onClick={handleNewFolder}
        />
        <ActionCard
          icon="🎨"
          title="模板中心"
          description="从模板中获取灵感"
          onClick={handleTemplates}
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
                onClick={() => handleDocumentClick(doc)}
              />
            ))
          )}
        </div>
      </section>

      {/* 弹窗 */}
      <CreateDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onCreateFolder={handleNewFolder}
        onConfirm={handleDocumentConfirm}
      />

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onConfirm={handleFolderConfirm}
      />
    </div>
  );
}

export default StartPage;

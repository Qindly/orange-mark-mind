import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts';
import { fetchRecentDocuments, fetchFavoriteDocuments, fetchDeletedDocuments } from '../../api/documents';
import type { Document } from '../../types';
import type { MenuKey } from '../../layouts/Sidebar';
import './Dashboard.scss';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('start');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments(activeMenu);
  }, [activeMenu]);

  const loadDocuments = async (menu: MenuKey) => {
    setLoading(true);
    try {
      let res;
      switch (menu) {
        case 'favorites':
          res = await fetchFavoriteDocuments();
          break;
        case 'trash':
          res = await fetchDeletedDocuments();
          break;
        default:
          res = await fetchRecentDocuments();
      }
      if (res.code === 0) {
        setDocuments(res.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuChange = (key: MenuKey) => {
    setActiveMenu(key);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 根据菜单渲染不同内容
  const renderContent = () => {
    switch (activeMenu) {
      case 'start':
        return (
          <div className="dashboard-content">
            {/* 开始区域 */}
            <section className="dashboard-start">
              <h2 className="dashboard-start__title">开始</h2>
              
              {/* 快捷操作 */}
              <div className="dashboard-start__actions">
                <div className="action-card">
                  <span className="action-card__icon">📄</span>
                  <div className="action-card__content">
                    <h3>新建文档</h3>
                    <p>文档、表格、画板、数据表</p>
                  </div>
                </div>
                <div className="action-card">
                  <span className="action-card__icon">📚</span>
                  <div className="action-card__content">
                    <h3>新建知识库</h3>
                    <p>使用知识库整理知识</p>
                  </div>
                </div>
                <div className="action-card">
                  <span className="action-card__icon">🎨</span>
                  <div className="action-card__content">
                    <h3>模板中心</h3>
                    <p>从模板中获取灵感</p>
                  </div>
                </div>
              </div>
              
              {/* AI 助手入口 */}
              <div className="ai-entry">
                <span className="ai-entry__icon">✨</span>
                <div className="ai-entry__content">
                  <h3>AI 帮你写</h3>
                  <p>AI 助手帮你一键生成文档</p>
                </div>
              </div>
            </section>

            {/* 文档列表区域 */}
            <section className="dashboard-docs">
              <h2 className="dashboard-docs__title">文档</h2>
              
              {/* 文档筛选标签 */}
              <div className="dashboard-docs__tabs">
                <button className="tab-btn active">编辑过</button>
                <button className="tab-btn">浏览过</button>
                <button className="tab-btn">我点赞的</button>
                <button className="tab-btn">我评论过</button>
              </div>

              {/* 文档列表 */}
              <div className="dashboard-docs__list">
                {renderDocumentList()}
              </div>
            </section>
          </div>
        );

      case 'favorites':
        return (
          <div className="page-placeholder">
            <h2 className="page-placeholder__title">⭐ 收藏页面</h2>
            <p className="page-placeholder__desc">这里显示您收藏的文档</p>
            <div className="dashboard-docs__list">
              {renderDocumentList()}
            </div>
          </div>
        );

      case 'trash':
        return (
          <div className="page-placeholder">
            <h2 className="page-placeholder__title">🗑️ 回收站页面</h2>
            <p className="page-placeholder__desc">这里显示已删除的文档</p>
            <div className="dashboard-docs__list">
              {renderDocumentList()}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="page-placeholder">
            <h2 className="page-placeholder__title">📋 模板页面</h2>
            <p className="page-placeholder__desc">这里显示可用的文档模板</p>
          </div>
        );

      case 'settings':
        return (
          <div className="page-placeholder">
            <h2 className="page-placeholder__title">⚙️ 设置页面</h2>
            <p className="page-placeholder__desc">这里可以进行系统设置</p>
          </div>
        );

      default:
        return (
          <div className="page-placeholder">
            <h2 className="page-placeholder__title">页面开发中...</h2>
          </div>
        );
    }
  };

  // 渲染文档列表
  const renderDocumentList = () => {
    if (loading) {
      return <div className="loading-placeholder">加载中...</div>;
    }
    
    if (documents.length === 0) {
      return <div className="empty-placeholder">暂无文档</div>;
    }

    return documents.map(doc => (
      <div key={doc.id} className="doc-item">
        <div className="doc-item__icon">
          <span>📄</span>
        </div>
        <div className="doc-item__content">
          <h4 className="doc-item__title">{doc.title}</h4>
          <span className="doc-item__folder">
            {doc.folder_name || '未分类'}
          </span>
        </div>
        <span className="doc-item__date">
          {formatDate(doc.updated_at)}
        </span>
      </div>
    ));
  };

  return (
    <DashboardLayout activeMenu={activeMenu} onMenuChange={handleMenuChange}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default Dashboard;

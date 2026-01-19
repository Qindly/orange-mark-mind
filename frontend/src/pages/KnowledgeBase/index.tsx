import { useState, useEffect, useCallback } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { ResizableSidebar } from "@/components";
import { fetchFolderById } from "@/api/folders";
import { fetchDocumentsByFolder, createDocument } from "@/api/documents";
import type { Folder, Document } from "@/types";
import "./KnowledgeBase.scss";

function KnowledgeBase() {
  const { folderId, docId } = useParams<{ folderId: string; docId?: string }>();
  const navigate = useNavigate();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFolderData = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const [folderRes, docsRes] = await Promise.all([
        fetchFolderById(folderId),
        fetchDocumentsByFolder(folderId),
      ]);
      if (folderRes.code === 0 && folderRes.data) {
        setFolder(folderRes.data);
      }
      if (docsRes.code === 0) {
        setDocuments(docsRes.data);
      }
    } catch (error) {
      console.error("Failed to load folder data:", error);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadFolderData();
  }, [loadFolderData]);

  // 监听文档标题更新事件，精准更新对应文档的标题（不刷新整个列表）
  useEffect(() => {
    const handleDocumentTitleUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ docId: string; title: string }>;
      const { docId: updatedDocId, title: newTitle } = customEvent.detail;

      // 只更新对应文档的标题
      setDocuments(prev => prev.map(doc =>
        doc.id === updatedDocId ? { ...doc, title: newTitle } : doc
      ));
    };

    window.addEventListener('document-title-updated', handleDocumentTitleUpdated);
    return () => {
      window.removeEventListener('document-title-updated', handleDocumentTitleUpdated);
    };
  }, []);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoHome = () => {
    navigate(`/${folderId}`);
  };

  const handleDocumentClick = (doc: Document) => {
    navigate(`/${folderId}/${doc.id}`);
  };

  const handleNewDocument = async () => {
    if (!folderId) return;

    try {
      const res = await createDocument({
        title: '无标题文档',
        folder_id: folderId
      });
      if (res.code === 0) {
        // 创建成功，跳转到新文档并刷新列表
        setDocuments(prev => [res.data, ...prev]);
        navigate(`/${folderId}/${res.data.id}`);
      } else {
        console.error('创建文档失败:', res.message);
      }
    } catch (error) {
      console.error('创建文档失败:', error);
    }
  };

  const isDocActive = (doc: Document) => {
    return doc.id === docId;
  };

  const isHomePage = !docId;

  // 搜索过滤文档
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <div className="kb-loading">加载中...</div>;
  }

  if (!folder) {
    return <div className="kb-error">知识库不存在</div>;
  }

  return (
    <div className="knowledge-base">
      {/* 左侧目录 - 使用可拖拽侧边栏 */}
      <ResizableSidebar minWidth={200} maxWidth={360} defaultWidth={240}>
        {/* 面包屑导航 */}
        <div className="kb-breadcrumb" onClick={handleBackToDashboard}>
          <span className="kb-breadcrumb__icon">🏠</span>
          <span className="kb-breadcrumb__arrow">›</span>
          <span className="kb-breadcrumb__text">个人知识库</span>
        </div>

        {/* 知识库标题 */}
        <div className="kb-header">
          <span className="kb-header__icon">📁</span>
          <span className="kb-header__title">{folder.name}</span>
          <button className="kb-header__more">•••</button>
        </div>

        {/* 搜索和添加 */}
        <div className="kb-search">
          <div className="kb-search__input-wrapper">
            <span className="kb-search__icon">🔍</span>
            <input
              type="text"
              className="kb-search__input"
              placeholder="搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="kb-search__add" onClick={handleNewDocument}>
            +
          </button>
        </div>

        {/* 首页链接 */}
        <div
          className={`kb-nav-item ${isHomePage ? "active" : ""}`}
          onClick={handleGoHome}
        >
          <span className="kb-nav-item__icon">🏠</span>
          <span>首页</span>
        </div>

        {/* 目录 */}
        <div className="kb-directory">
          <div className="kb-directory__header">
            <span className="kb-directory__icon">📑</span>
            <span className="kb-directory__title">目录</span>
            <button className="kb-directory__toggle">≡</button>
          </div>
          <div className="kb-directory__list">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`kb-directory__item ${isDocActive(doc) ? "active" : ""}`}
                onClick={() => handleDocumentClick(doc)}
              >
                {doc.title}
              </div>
            ))}
          </div>
        </div>
      </ResizableSidebar>

      {/* 右侧内容区 */}
      <main className="kb-content">
        {isHomePage ? (
          <KBWelcome
            folder={folder}
            documents={documents}
            onDocClick={handleDocumentClick}
          />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

// 知识库欢迎页组件
function KBWelcome({
  folder,
  documents,
  onDocClick,
}: {
  folder: Folder;
  documents: Document[];
  onDocClick: (doc: Document) => void;
}) {
  const totalWords = documents.reduce((sum, doc) => {
    return sum + (doc.content?.length || 0);
  }, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="kb-welcome">
      <header className="kb-welcome__header">
        <div className="kb-welcome__info">
          <div className="kb-welcome__title-row">
            <span className="kb-welcome__icon">📁</span>
            <h1 className="kb-welcome__title">{folder.name}</h1>
          </div>
          <div className="kb-welcome__stats">
            <span>{documents.length} 文档</span>
            <span>{totalWords} 字</span>
          </div>
        </div>
        <div className="kb-welcome__actions">
          <button className="btn btn-outline">☆ 收藏</button>
          <button className="btn btn-outline">分享</button>
          <button className="btn btn-outline">•••</button>
        </div>
      </header>

      <section className="kb-welcome__intro">
        <div className="kb-welcome__intro-icon">👋</div>
        <div className="kb-welcome__intro-text">
          <h3>欢迎来到知识库</h3>
          <p>知识库就像书一样，让多篇文档结构化，方便知识的创作与沉淀</p>
        </div>
      </section>

      <section className="kb-welcome__docs">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="kb-welcome__doc-item"
            onClick={() => onDocClick(doc)}
          >
            <span className="kb-welcome__doc-title">{doc.title}</span>
            <span className="kb-welcome__doc-date">
              {formatDate(doc.updated_at)}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default KnowledgeBase;

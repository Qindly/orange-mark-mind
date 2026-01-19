import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDocumentById, updateDocument } from '@/api/documents';
import type { Document } from '@/types';
import './DocumentView.scss';

function DocumentView() {
  const { docId } = useParams<{ docId: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const loadDocument = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await fetchDocumentById(docId);
      if (res.code === 0 && res.data) {
        setDocument(res.data);
        setEditTitle(res.data.title || '');
        setEditContent(res.data.content || '');
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleSave = async () => {
    if (!docId || !document) return;

    setSaving(true);
    try {
      const res = await updateDocument(docId, {
        title: editTitle.trim() || '无标题文档',
        content: editContent,
      });

      if (res.code === 0) {
        // 更新本地状态
        setDocument(prev => prev ? {
          ...prev,
          title: editTitle.trim() || '无标题文档',
          content: editContent,
        } : null);
        setIsEditing(false);
      } else {
        console.error('保存文档失败:', res.message);
      }
    } catch (error) {
      console.error('保存文档失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 恢复到原始内容
    if (document) {
      setEditTitle(document.title || '');
      setEditContent(document.content || '');
    }
    setIsEditing(false);
  };

  const renderContent = (content: string) => {
    // 简单的 Markdown 渲染
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // 标题
      if (line.startsWith('# ')) {
        return <h1 key={index} className="doc-h1">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="doc-h2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="doc-h3">{line.slice(4)}</h3>;
      }
      // 代码块开始
      if (line.startsWith('```')) {
        return null; // 简化处理
      }
      // 列表
      if (line.match(/^\d+\. /)) {
        return <p key={index} className="doc-list-item">{line}</p>;
      }
      // 普通段落
      if (line.trim()) {
        return <p key={index} className="doc-paragraph">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  if (loading) {
    return <div className="doc-loading">加载中...</div>;
  }

  if (!document) {
    return <div className="doc-error">文档不存在</div>;
  }

  return (
    <div className="document-view">
      {/* 顶部：标题和操作 */}
      <header className="document-view__header">
        {isEditing ? (
          <input
            type="text"
            className="document-view__title-input"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="请输入标题"
          />
        ) : (
          <h1 className="document-view__title">{document.title}</h1>
        )}
        <div className="document-view__actions">
          {document.is_favorited && <span className="doc-star">⭐</span>}
          {isEditing ? (
            <>
              <button
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={saving}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              编辑
            </button>
          )}
        </div>
      </header>

      {/* 正文内容 */}
      <div className="document-view__content">
        {isEditing ? (
          <textarea
            className="document-view__editor"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="开始编写..."
          />
        ) : (
          <article className="document-view__body">
            {renderContent(document.content || '')}
          </article>
        )}
      </div>
    </div>
  );
}

export default DocumentView;


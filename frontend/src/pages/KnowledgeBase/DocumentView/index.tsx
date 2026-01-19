import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDocumentById, updateDocument, deleteDocument } from '@/api/documents';
import type { Document } from '@/types';
import './DocumentView.scss';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function DocumentView() {
  const { folderId, docId } = useParams<{ folderId: string; docId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 防抖 timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 保存状态显示 timer ref
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 记录原始内容用于比较是否有变化
  const originalContentRef = useRef({ title: '', content: '' });

  const loadDocument = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await fetchDocumentById(docId);
      if (res.code === 0 && res.data) {
        setDocument(res.data);
        setEditTitle(res.data.title || '');
        setEditContent(res.data.content || '');
        originalContentRef.current = {
          title: res.data.title || '',
          content: res.data.content || '',
        };
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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (savedStatusTimerRef.current) {
        clearTimeout(savedStatusTimerRef.current);
      }
    };
  }, []);

  // 自动保存函数（不退出编辑模式）
  const autoSave = useCallback(async (title: string, content: string) => {
    if (!docId) return;

    // 检查内容是否有变化
    if (title === originalContentRef.current.title &&
      content === originalContentRef.current.content) {
      return; // 内容没变，不需要保存
    }

    setSaveStatus('saving');
    try {
      const res = await updateDocument(docId, {
        title: title.trim() || '无标题文档',
        content: content,
      });

      if (res.code === 0) {
        // 更新原始内容引用
        originalContentRef.current = {
          title: title.trim() || '无标题文档',
          content: content,
        };
        // 更新本地 document 状态
        setDocument(prev => prev ? {
          ...prev,
          title: title.trim() || '无标题文档',
          content: content,
        } : null);
        setSaveStatus('saved');

        // 触发文档更新事件，通知父组件刷新列表
        window.dispatchEvent(new CustomEvent('document-updated'));

        // 3 秒后隐藏"已保存"状态
        if (savedStatusTimerRef.current) {
          clearTimeout(savedStatusTimerRef.current);
        }
        savedStatusTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } else {
        console.error('自动保存失败:', res.message);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('自动保存失败:', error);
      setSaveStatus('error');
    }
  }, [docId]);

  // 防抖触发自动保存
  const triggerAutoSave = useCallback((title: string, content: string) => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的定时器，2 秒后自动保存
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(title, content);
    }, 2000);
  }, [autoSave]);

  // 标题变化处理
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setEditTitle(newTitle);
    triggerAutoSave(newTitle, editContent);
  };

  // 内容变化处理
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditContent(newContent);
    triggerAutoSave(editTitle, newContent);
  };

  // 手动保存并退出编辑模式
  const handleSaveAndExit = async () => {
    if (!docId || !document) return;

    // 清除自动保存定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('saving');
    try {
      const res = await updateDocument(docId, {
        title: editTitle.trim() || '无标题文档',
        content: editContent,
      });

      if (res.code === 0) {
        originalContentRef.current = {
          title: editTitle.trim() || '无标题文档',
          content: editContent,
        };
        setDocument(prev => prev ? {
          ...prev,
          title: editTitle.trim() || '无标题文档',
          content: editContent,
        } : null);
        setSaveStatus('saved');
        // 触发文档更新事件，通知父组件刷新列表
        window.dispatchEvent(new CustomEvent('document-updated'));
        setIsEditing(false);
      } else {
        console.error('保存文档失败:', res.message);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('保存文档失败:', error);
      setSaveStatus('error');
    }
  };

  const handleCancel = () => {
    // 清除自动保存定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    // 恢复到原始内容
    setEditTitle(originalContentRef.current.title);
    setEditContent(originalContentRef.current.content);
    setSaveStatus('idle');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!docId || !folderId) return;

    // 使用 confirm 确认删除
    const confirmed = window.confirm('确定要删除这篇文档吗？删除后可以在回收站中恢复。');
    if (!confirmed) return;

    try {
      const res = await deleteDocument(docId);
      if (res.code === 0) {
        // 删除成功，跳转回知识库首页
        navigate(`/${folderId}`);
      } else {
        console.error('删除文档失败:', res.message);
        alert('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="doc-h1">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="doc-h2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="doc-h3">{line.slice(4)}</h3>;
      }
      if (line.startsWith('```')) {
        return null;
      }
      if (line.match(/^\d+\. /)) {
        return <p key={index} className="doc-list-item">{line}</p>;
      }
      if (line.trim()) {
        return <p key={index} className="doc-paragraph">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="save-status save-status--saving">保存中...</span>;
      case 'saved':
        return <span className="save-status save-status--saved">已保存</span>;
      case 'error':
        return <span className="save-status save-status--error">保存失败</span>;
      default:
        return null;
    }
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
            onChange={handleTitleChange}
            placeholder="请输入标题"
          />
        ) : (
          <h1 className="document-view__title">{document.title}</h1>
        )}
        <div className="document-view__actions">
          {isEditing && renderSaveStatus()}
          {document.is_favorited && <span className="doc-star">⭐</span>}
          {isEditing ? (
            <>
              <button
                className="btn btn-outline"
                onClick={handleCancel}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAndExit}
                disabled={saveStatus === 'saving'}
              >
                完成
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline btn-danger"
                onClick={handleDelete}
              >
                删除
              </button>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                编辑
              </button>
            </>
          )}
        </div>
      </header>

      {/* 正文内容 */}
      <div className="document-view__content">
        {isEditing ? (
          <textarea
            className="document-view__editor"
            value={editContent}
            onChange={handleContentChange}
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

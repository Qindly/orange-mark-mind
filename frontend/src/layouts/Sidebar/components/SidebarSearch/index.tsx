import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchDocuments } from '@/api/documents';
import { useClickOutside } from '@/hooks';
import type { Document } from '@/types';
import './SidebarSearch.scss';

interface SidebarSearchProps {
  onNewDocument?: () => void;
}

function SidebarSearch({ onNewDocument }: SidebarSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchDocuments(query.trim(), 8);
        if (res.code === 0) {
          setResults(res.data || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useClickOutside(containerRef, useCallback(() => setShowResults(false), []));

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showResults, results, selectedIndex]);

  // 选择搜索结果
  const handleSelectResult = (doc: Document) => {
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
    navigate(`/${doc.folder_id}/${doc.id}`);
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${Math.floor(days / 30)}个月前`;
  };

  return (
    <div className="sidebar-search" ref={containerRef}>
      <div className="sidebar-search__input-wrapper">
        <span className="sidebar-search__icon">
          {isLoading ? (
            <span className="sidebar-search__spinner"></span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="sidebar-search__input"
          placeholder="搜索文档..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
        />
      </div>
      <button
        className="sidebar-search__new-btn"
        title="新建文档"
        onClick={onNewDocument}
      >
        +
      </button>

      {/* 搜索结果下拉 */}
      {showResults && (
        <div className="sidebar-search__results">
          {results.length > 0 ? (
            <>
              {results.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`sidebar-search__result-item ${index === selectedIndex ? 'sidebar-search__result-item--active' : ''}`}
                  onClick={() => handleSelectResult(doc)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="sidebar-search__result-title">{doc.title}</div>
                  <div className="sidebar-search__result-meta">
                    {doc.folder_name && <span>{doc.folder_name}</span>}
                    <span className="sidebar-search__result-time">{formatTime(doc.updated_at)}</span>
                  </div>
                </div>
              ))}
              <div className="sidebar-search__results-footer">
                共找到 {results.length} 个结果
              </div>
            </>
          ) : (
            <div className="sidebar-search__no-results">
              没有找到相关文档
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SidebarSearch;

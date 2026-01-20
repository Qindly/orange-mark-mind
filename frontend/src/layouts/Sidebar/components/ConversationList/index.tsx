import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConversations, createConversation, deleteConversation, searchConversations } from '@/api/conversations';
import type { ConversationListItem } from '@/api/conversations';
import './ConversationList.scss';

interface ConversationListProps {
    onNewConversation?: () => void;
}

function ConversationList({ onNewConversation }: ConversationListProps) {
    const navigate = useNavigate();
    const { id: activeId } = useParams<{ id: string }>();
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ConversationListItem[] | null>(null);

    useEffect(() => {
        loadConversations();
    }, []);

    // Listen for conversation updates from chat page
    useEffect(() => {
        const handleConversationUpdated = () => {
            loadConversations();
        };
        window.addEventListener('conversation-updated', handleConversationUpdated);
        return () => {
            window.removeEventListener('conversation-updated', handleConversationUpdated);
        };
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const res = await getConversations();
            if (res.code === 0) {
                setConversations(res.data || []);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewConversation = async () => {
        try {
            const res = await createConversation();
            if (res.code === 0 && res.data) {
                navigate(`/dashboard/conversations/${res.data.id}`);
                onNewConversation?.();
                loadConversations();
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleSelect = (id: number) => {
        navigate(`/dashboard/conversations/${id}`);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('确定要删除这个对话吗？')) return;

        try {
            const res = await deleteConversation(id);
            if (res.code === 0) {
                loadConversations();
                if (activeId && parseInt(activeId) === id) {
                    navigate('/dashboard/conversations');
                }
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        try {
            const res = await searchConversations(query);
            if (res.code === 0) {
                setSearchResults(res.data || []);
            }
        } catch (error) {
            console.error('Failed to search:', error);
        }
    };

    const displayList = searchResults !== null ? searchResults : conversations;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="conversation-list">
            <div className="conversation-list__header">
                <button
                    className="conversation-list__new-btn"
                    onClick={handleNewConversation}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    新建对话
                </button>
            </div>

            <div className="conversation-list__search">
                <input
                    type="text"
                    placeholder="搜索对话..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="conversation-list__search-input"
                />
            </div>

            <div className="conversation-list__content">
                {loading ? (
                    <div className="conversation-list__loading">加载中...</div>
                ) : displayList.length === 0 ? (
                    <div className="conversation-list__empty">
                        {searchQuery ? '没有找到相关对话' : '暂无对话，点击上方按钮创建'}
                    </div>
                ) : (
                    <ul className="conversation-list__items">
                        {displayList.map((conv) => (
                            <li
                                key={conv.id}
                                className={`conversation-list__item ${activeId && parseInt(activeId) === conv.id ? 'conversation-list__item--active' : ''}`}
                                onClick={() => handleSelect(conv.id)}
                            >
                                <div className="conversation-list__item-content">
                                    <span className="conversation-list__item-title">
                                        {conv.title || '新对话'}
                                    </span>
                                    <span className="conversation-list__item-date">
                                        {formatDate(conv.updated_at)}
                                    </span>
                                </div>
                                <button
                                    className="conversation-list__item-delete"
                                    onClick={(e) => handleDelete(e, conv.id)}
                                    title="删除"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ConversationList;

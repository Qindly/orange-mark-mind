import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getConversation,
    createConversation,
    sendMessage,
    updateConversationTitle
} from '@/api/conversations';
import { getAIConfigs } from '@/api/ai';
import type { ConversationDetail, Message } from '@/api/conversations';
import type { AIConfig } from '@/types/ai';
import './ConversationsPage.scss';

function ConversationsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState<ConversationDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    useEffect(() => {
        if (id) {
            loadConversation(parseInt(id));
        } else {
            // New conversation mode
            setConversation(null);
            setMessages([]);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConfigs = async () => {
        try {
            const res = await getAIConfigs();
            if (res.code === 0 && res.data) {
                setConfigs(res.data);
                const defaultConfig = res.data.find(c => c.is_default);
                if (defaultConfig) {
                    setSelectedConfig(defaultConfig);
                    if (defaultConfig.available_models.length > 0) {
                        setSelectedModel(defaultConfig.available_models[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load configs:', error);
        }
    };

    const loadConversation = async (convId: number) => {
        try {
            setLoading(true);
            const res = await getConversation(convId);
            if (res.code === 0 && res.data) {
                setConversation(res.data);
                setMessages(res.data.messages || []);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!inputValue.trim() || sending || !selectedModel) return;

        let convId = conversation?.id;

        // If no conversation exists, create one first
        if (!convId) {
            try {
                const res = await createConversation();
                if (res.code === 0 && res.data) {
                    convId = res.data.id;
                    setConversation(res.data);
                    navigate(`/dashboard/conversations/${convId}`, { replace: true });
                }
            } catch (error) {
                console.error('Failed to create conversation:', error);
                return;
            }
        }

        const userMessage: Message = {
            id: Date.now(),
            conversation_id: convId,
            role: 'user',
            content: inputValue,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSending(true);

        try {
            const res = await sendMessage(convId, {
                content: inputValue,
                model: selectedModel,
            });

            if (res.code === 0) {
                // Reload conversation to get updated messages
                loadConversation(convId);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTitleEdit = () => {
        setEditTitle(conversation?.title || '');
        setIsEditingTitle(true);
    };

    const handleTitleSave = async () => {
        if (!conversation?.id) return;
        try {
            await updateConversationTitle(conversation.id, editTitle);
            setConversation(prev => prev ? { ...prev, title: editTitle } : null);
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to update title:', error);
        }
    };

    const handleConfigChange = (configId: number) => {
        const config = configs.find(c => c.id === configId);
        if (config) {
            setSelectedConfig(config);
            if (config.available_models.length > 0) {
                setSelectedModel(config.available_models[0]);
            }
        }
    };

    if (loading && id) {
        return (
            <div className="conversations-page">
                <div className="conversations-page__loading">加载中...</div>
            </div>
        );
    }

    return (
        <div className="conversations-page">
            <div className="conversations-page__header">
                {isEditingTitle ? (
                    <div className="conversations-page__title-edit">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                        />
                    </div>
                ) : (
                    <h1
                        className="conversations-page__title"
                        onClick={handleTitleEdit}
                        title="点击编辑标题"
                    >
                        {conversation?.title || '新对话'}
                    </h1>
                )}
            </div>

            <div className="conversations-page__messages">
                {messages.length === 0 ? (
                    <div className="conversations-page__empty">
                        <div className="conversations-page__empty-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <path d="M8 9h8" />
                                <path d="M8 13h6" />
                            </svg>
                        </div>
                        <p>开始一段新对话</p>
                        <span>选择模型，输入您的问题</span>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`conversations-page__message conversations-page__message--${msg.role}`}
                        >
                            <div className="conversations-page__message-avatar">
                                {msg.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="conversations-page__message-content">
                                <div className="conversations-page__message-text">
                                    {msg.content}
                                </div>
                                {msg.model && (
                                    <div className="conversations-page__message-meta">
                                        {msg.model}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="conversations-page__input-area">
                <div className="conversations-page__input-controls">
                    <select
                        className="conversations-page__config-select"
                        value={selectedConfig?.id || ''}
                        onChange={(e) => handleConfigChange(parseInt(e.target.value))}
                    >
                        {configs.map((config) => (
                            <option key={config.id} value={config.id}>
                                {config.config_name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="conversations-page__model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        {selectedConfig?.available_models.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="conversations-page__input-wrapper">
                    <textarea
                        className="conversations-page__input"
                        placeholder="输入消息..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button
                        className="conversations-page__send-btn"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sending || !selectedModel}
                    >
                        {sending ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConversationsPage;

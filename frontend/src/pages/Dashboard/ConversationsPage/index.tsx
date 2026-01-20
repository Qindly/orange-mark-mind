import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getConversation,
    createConversation,
    sendMessageStream,
    updateConversationTitle
} from '@/api/conversations';
import { getAIConfigs } from '@/api/ai';
import type { ConversationDetail, Message, StreamChunk } from '@/api/conversations';
import type { AIConfig } from '@/types/ai';
import DocumentSelector from '@/components/Chat/DocumentSelector';
import type { SelectedDocument } from '@/components/Chat/DocumentSelector';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [showDocSelector, setShowDocSelector] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<SelectedDocument[]>([]);

    useEffect(() => {
        loadConfigs();
    }, []);

    useEffect(() => {
        if (id) {
            loadConversation(parseInt(id));
        } else {
            setConversation(null);
            setMessages([]);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [inputValue]);

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

        if (!convId) {
            try {
                const res = await createConversation();
                if (res.code === 0 && res.data) {
                    convId = res.data.id;
                    setConversation(res.data);
                    navigate(`/dashboard/conversations/${convId}`, { replace: true });
                } else {
                    return;
                }
            } catch (error) {
                console.error('Failed to create conversation:', error);
                return;
            }
        }

        // At this point convId is definitely defined
        const currentConvId = convId;

        const userMessage: Message = {
            id: Date.now(),
            conversation_id: currentConvId,
            role: 'user',
            content: inputValue,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSending(true);
        setStreamingContent('');

        // Add placeholder for AI message
        const aiMessagePlaceholder: Message = {
            id: Date.now() + 1,
            conversation_id: currentConvId,
            role: 'assistant',
            content: '',
            model: selectedModel,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessagePlaceholder]);

        try {
            const token = localStorage.getItem('access_token') || '';
            let fullContent = '';

            // Include selected document IDs for RAG
            const docIds = selectedDocs.map(d => parseInt(d.id));

            await sendMessageStream(
                currentConvId,
                {
                    content: inputValue,
                    model: selectedModel,
                    doc_ids: docIds.length > 0 ? docIds : undefined,
                },
                (chunk: StreamChunk) => {
                    if (chunk.content) {
                        fullContent += chunk.content;
                        setStreamingContent(fullContent);
                        // Update the last message with streaming content
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (newMessages.length > 0) {
                                newMessages[newMessages.length - 1] = {
                                    ...newMessages[newMessages.length - 1],
                                    content: fullContent,
                                };
                            }
                            return newMessages;
                        });
                    }
                    if (chunk.error) {
                        console.error('Stream error:', chunk.error);
                    }
                },
                token
            );

            // Reload conversation to get the saved message
            loadConversation(currentConvId);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove the placeholder message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setSending(false);
            setStreamingContent('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTitleClick = () => {
        if (conversation) {
            setEditTitle(conversation.title || '新对话');
            setIsEditingTitle(true);
        }
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

    if (loading && id) {
        return (
            <div className="chat-page">
                <div className="chat-page__loading">
                    <div className="chat-page__loading-spinner"></div>
                    <span>加载中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Header with title */}
            {conversation && (
                <header className="chat-page__header">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            className="chat-page__title-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                        />
                    ) : (
                        <button className="chat-page__title-btn" onClick={handleTitleClick}>
                            {conversation.title || '新对话'}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    )}
                </header>
            )}

            {/* Messages area */}
            <main className="chat-page__messages">
                {messages.length === 0 ? (
                    <div className="chat-page__welcome">
                        <h1 className="chat-page__welcome-title">
                            <span className="chat-page__welcome-gradient">你好，有什么可以帮助你的吗？</span>
                        </h1>
                        <p className="chat-page__welcome-subtitle">
                            选择模型，开始一段新对话
                        </p>
                    </div>
                ) : (
                    <div className="chat-page__messages-list">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message chat-message--${msg.role}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="chat-message__avatar">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                                <div className="chat-message__content">
                                    <div className="chat-message__text">
                                        {msg.content}
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <div className="chat-message__actions">
                                            <button title="复制">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            </button>
                                            <button title="重新生成">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 4v6h6M23 20v-6h-6" />
                                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Input area - Gemini style */}
            <footer className="chat-page__footer">
                <div className="chat-input">
                    <textarea
                        ref={textareaRef}
                        className="chat-input__textarea"
                        placeholder="问问 Orange Mind..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    {/* Selected documents tags */}
                    {selectedDocs.length > 0 && (
                        <div className="chat-input__docs">
                            {selectedDocs.map(doc => (
                                <span key={doc.id} className="chat-input__doc-tag">
                                    {doc.title}
                                    <button onClick={() => setSelectedDocs(prev => prev.filter(d => d.id !== doc.id))}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="chat-input__toolbar">
                        <div className="chat-input__toolbar-left">
                            <button
                                className="chat-input__btn"
                                title="添加文档引用"
                                onClick={() => setShowDocSelector(true)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>
                        <div className="chat-input__toolbar-right">
                            <select
                                className="chat-input__model-select"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                            >
                                {selectedConfig?.available_models.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                            <button
                                className={`chat-input__send ${inputValue.trim() && !sending ? 'chat-input__send--active' : ''}`}
                                onClick={handleSend}
                                disabled={!inputValue.trim() || sending || !selectedModel}
                            >
                                {sending ? (
                                    <div className="chat-input__send-loading"></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <p className="chat-page__disclaimer">
                    AI 回复仅供参考，请注意核查
                </p>
            </footer>

            {/* Document Selector Modal */}
            <DocumentSelector
                isOpen={showDocSelector}
                onClose={() => setShowDocSelector(false)}
                onSelect={setSelectedDocs}
                selectedDocs={selectedDocs}
            />
        </div>
    );
}

export default ConversationsPage;

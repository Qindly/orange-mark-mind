import './ConversationsPage.scss';

function ConversationsPage() {
    return (
        <div className="conversations-page">
            <div className="conversations-page__header">
                <h1 className="conversations-page__title">AI 对话</h1>
                <p className="conversations-page__subtitle">
                    与 AI 助手进行智能对话，探索知识的边界
                </p>
            </div>

            <div className="conversations-page__placeholder">
                <div className="conversations-page__placeholder-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 9h8" />
                        <path d="M8 13h6" />
                    </svg>
                </div>
                <h2 className="conversations-page__placeholder-title">
                    功能开发中
                </h2>
                <p className="conversations-page__placeholder-text">
                    AI 对话功能正在紧张开发中，敬请期待...
                </p>
            </div>
        </div>
    );
}

export default ConversationsPage;

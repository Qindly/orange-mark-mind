import { useState, useEffect } from 'react';
import { AI_PROVIDER_LABELS } from '@/types/ai';
import type { AIConfig } from '@/types/ai';
import { getAIConfigs, setDefaultAIConfig, deleteAIConfig } from '@/api/ai';
import AIProviderModal from '@/components/common/AIProviderModal';
import './AIProviderSettings.scss';

interface AIProviderSettingsProps {
    onConfigChange?: () => void;
}

function AIProviderSettings({ onConfigChange }: AIProviderSettingsProps) {
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const res = await getAIConfigs();
            if (res.code === 0 && res.data) {
                setConfigs(res.data);
            }
        } catch (error) {
            console.error('Failed to load AI configs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const handleSetDefault = async (id: number) => {
        try {
            setActionLoading(id);
            const res = await setDefaultAIConfig(id);
            if (res.code === 0) {
                await loadConfigs();
                onConfigChange?.();
            }
        } catch (error) {
            console.error('Failed to set default:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除此配置吗？')) return;
        try {
            setActionLoading(id);
            const res = await deleteAIConfig(id);
            if (res.code === 0) {
                await loadConfigs();
                onConfigChange?.();
            }
        } catch (error) {
            console.error('Failed to delete config:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (config: AIConfig) => {
        setEditingConfig(config);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingConfig(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

    const handleModalSave = async () => {
        await loadConfigs();
        onConfigChange?.();
        handleModalClose();
    };

    return (
        <div className="ai-provider-settings">
            <div className="ai-provider-settings__header">
                <button
                    className="ai-provider-settings__add-btn"
                    onClick={handleAdd}
                >
                    + 新建提供商
                </button>
            </div>

            {loading ? (
                <div className="ai-provider-settings__loading">加载中...</div>
            ) : configs.length === 0 ? (
                <div className="ai-provider-settings__empty">
                    <p>暂无 AI 提供商配置</p>
                    <p className="ai-provider-settings__empty-hint">
                        点击"新建提供商"按钮添加您的第一个 AI 提供商
                    </p>
                </div>
            ) : (
                <div className="ai-provider-settings__list">
                    {configs.map((config) => (
                        <div key={config.id} className="ai-provider-settings__item">
                            <div className="ai-provider-settings__item-info" onClick={() => handleEdit(config)}>
                                <div className="ai-provider-settings__item-name">
                                    {config.config_name}
                                    {config.is_default && (
                                        <span className="ai-provider-settings__default-badge">默认</span>
                                    )}
                                </div>
                                <div className="ai-provider-settings__item-meta">
                                    <span className="ai-provider-settings__item-type">
                                        {AI_PROVIDER_LABELS[config.provider_type]}
                                    </span>
                                    <span className="ai-provider-settings__item-models">
                                        {config.available_models.length} 个模型
                                    </span>
                                </div>
                            </div>
                            <div className="ai-provider-settings__item-actions">
                                {!config.is_default && (
                                    <button
                                        className="ai-provider-settings__action-btn"
                                        onClick={() => handleSetDefault(config.id)}
                                        disabled={actionLoading === config.id}
                                    >
                                        设为默认
                                    </button>
                                )}
                                <button
                                    className="ai-provider-settings__action-btn ai-provider-settings__action-btn--danger"
                                    onClick={() => handleDelete(config.id)}
                                    disabled={actionLoading === config.id}
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AIProviderModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleModalSave}
                editingConfig={editingConfig}
            />
        </div>
    );
}

export default AIProviderSettings;

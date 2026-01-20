import { useState, useEffect } from 'react';
import Modal from '../Modal';
import {
    AI_PROVIDER_LABELS,
    AI_PROVIDER_ENDPOINTS,
    AI_PROVIDER_MODELS_ENDPOINTS,
} from '@/types/ai';
import type { AIConfig, AIProviderType, CreateAIConfigRequest } from '@/types/ai';
import { createAIConfig, updateAIConfig } from '@/api/ai';
import './AIProviderModal.scss';

interface AIProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingConfig: AIConfig | null;
}

const PROVIDER_TYPES: AIProviderType[] = ['openai_compatible', 'anthropic', 'gemini'];

function AIProviderModal({ isOpen, onClose, onSave, editingConfig }: AIProviderModalProps) {
    const [configName, setConfigName] = useState('');
    const [providerType, setProviderType] = useState<AIProviderType>('openai_compatible');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [newModel, setNewModel] = useState('');
    const [saving, setSaving] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens/closes or editing config changes
    useEffect(() => {
        if (isOpen) {
            if (editingConfig) {
                setConfigName(editingConfig.config_name);
                setProviderType(editingConfig.provider_type);
                setBaseUrl(editingConfig.base_url);
                setApiKey(''); // Don't show existing API key
                setModels([...editingConfig.available_models]);
            } else {
                setConfigName('');
                setProviderType('openai_compatible');
                setBaseUrl('');
                setApiKey('');
                setModels([]);
            }
            setNewModel('');
            setError('');
        }
    }, [isOpen, editingConfig]);

    // Get full URL hint based on provider type and base URL
    const getFullUrlHint = () => {
        if (!baseUrl) return '';
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        return `${cleanBaseUrl}${AI_PROVIDER_ENDPOINTS[providerType]}`;
    };

    const handleAddModel = () => {
        const trimmed = newModel.trim();
        if (trimmed && !models.includes(trimmed)) {
            setModels([...models, trimmed]);
            setNewModel('');
        }
    };

    const handleRemoveModel = (model: string) => {
        setModels(models.filter((m) => m !== model));
    };

    const handleFetchModels = async () => {
        if (!baseUrl || !apiKey) {
            setError('请先填写 Base URL 和 API Key');
            return;
        }

        const modelsEndpoint = AI_PROVIDER_MODELS_ENDPOINTS[providerType];
        if (!modelsEndpoint) {
            setError('该提供商不支持自动获取模型列表，请手动输入');
            return;
        }

        try {
            setFetchingModels(true);
            setError('');

            // Directly call the upstream /models API
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
            const modelsUrl = `${cleanBaseUrl}${modelsEndpoint}`;

            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                setError(`获取模型列表失败: ${response.status} ${errorText}`);
                return;
            }

            const data = await response.json();

            // Parse response based on provider type
            let fetchedModels: string[] = [];

            if (providerType === 'openai_compatible') {
                // OpenAI format: { object: "list", data: [{ id: "gpt-4", ... }] }
                if (data.data && Array.isArray(data.data)) {
                    fetchedModels = data.data.map((m: { id: string }) => m.id);
                }
            } else if (providerType === 'gemini') {
                // Gemini format: { models: [{ name: "models/gemini-pro", ... }] }
                if (data.models && Array.isArray(data.models)) {
                    fetchedModels = data.models.map((m: { name: string }) => {
                        // Extract model name from "models/gemini-pro" format
                        const name = m.name || '';
                        return name.startsWith('models/') ? name.replace('models/', '') : name;
                    });
                }
            }

            if (fetchedModels.length === 0) {
                setError('未获取到可用模型');
                return;
            }

            // Merge with existing models, avoiding duplicates
            const mergedModels = [...new Set([...models, ...fetchedModels])];
            setModels(mergedModels);
        } catch (err) {
            setError('获取模型列表失败，请检查配置');
            console.error('Fetch models error:', err);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!configName.trim()) {
            setError('请输入配置名称');
            return;
        }
        if (!baseUrl.trim()) {
            setError('请输入 Base URL');
            return;
        }
        if (!editingConfig && !apiKey.trim()) {
            setError('请输入 API Key');
            return;
        }
        if (models.length === 0) {
            setError('请至少添加一个模型');
            return;
        }

        try {
            setSaving(true);
            setError('');

            if (editingConfig) {
                // Update existing config
                const res = await updateAIConfig(editingConfig.id, {
                    config_name: configName.trim(),
                    provider_type: providerType,
                    base_url: baseUrl.trim(),
                    api_key: apiKey.trim() || undefined, // Only include if provided
                    available_models: models,
                });
                if (res.code !== 0) {
                    setError(res.message || '更新配置失败');
                    return;
                }
            } else {
                // Create new config
                const data: CreateAIConfigRequest = {
                    config_name: configName.trim(),
                    provider_type: providerType,
                    base_url: baseUrl.trim(),
                    api_key: apiKey.trim(),
                    available_models: models,
                };
                const res = await createAIConfig(data);
                if (res.code !== 0) {
                    setError(res.message || '创建配置失败');
                    return;
                }
            }

            onSave();
        } catch (err) {
            setError('保存失败，请重试');
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddModel();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingConfig ? '编辑 AI 提供商' : '新建 AI 提供商'}
            width={520}
        >
            <div className="ai-provider-modal">
                {error && <div className="ai-provider-modal__error">{error}</div>}

                <div className="ai-provider-modal__field">
                    <label className="ai-provider-modal__label">配置名称</label>
                    <input
                        type="text"
                        className="ai-provider-modal__input"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="例如：OpenAI、Claude..."
                    />
                </div>

                <div className="ai-provider-modal__field">
                    <label className="ai-provider-modal__label">提供商类型</label>
                    <select
                        className="ai-provider-modal__select"
                        value={providerType}
                        onChange={(e) => setProviderType(e.target.value as AIProviderType)}
                    >
                        {PROVIDER_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {AI_PROVIDER_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ai-provider-modal__field">
                    <label className="ai-provider-modal__label">Base URL</label>
                    <input
                        type="text"
                        className="ai-provider-modal__input"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="例如：https://api.openai.com"
                    />
                    {baseUrl && (
                        <div className="ai-provider-modal__hint">
                            完整路径: <code>{getFullUrlHint()}</code>
                        </div>
                    )}
                </div>

                <div className="ai-provider-modal__field">
                    <label className="ai-provider-modal__label">
                        API Key
                        {editingConfig && (
                            <span className="ai-provider-modal__label-hint">
                                (留空则保持原有 Key)
                            </span>
                        )}
                    </label>
                    <input
                        type="password"
                        className="ai-provider-modal__input"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={editingConfig ? '留空保持原有 Key' : '输入 API Key'}
                    />
                </div>

                <div className="ai-provider-modal__field">
                    <label className="ai-provider-modal__label">模型配置</label>
                    <div className="ai-provider-modal__models">
                        <div className="ai-provider-modal__models-input">
                            <input
                                type="text"
                                className="ai-provider-modal__input"
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="输入模型名称，按回车添加"
                            />
                            <button
                                type="button"
                                className="ai-provider-modal__btn ai-provider-modal__btn--add"
                                onClick={handleAddModel}
                            >
                                +
                            </button>
                            <button
                                type="button"
                                className="ai-provider-modal__btn ai-provider-modal__btn--fetch"
                                onClick={handleFetchModels}
                                disabled={fetchingModels || !AI_PROVIDER_MODELS_ENDPOINTS[providerType]}
                                title={!AI_PROVIDER_MODELS_ENDPOINTS[providerType] ? '该提供商不支持自动获取' : ''}
                            >
                                {fetchingModels ? '获取中...' : '从上游获取'}
                            </button>
                        </div>
                        {models.length > 0 && (
                            <div className="ai-provider-modal__models-list">
                                {models.map((model) => (
                                    <div key={model} className="ai-provider-modal__model-tag">
                                        <span>{model}</span>
                                        <button
                                            type="button"
                                            className="ai-provider-modal__model-remove"
                                            onClick={() => handleRemoveModel(model)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ai-provider-modal__footer">
                    <button
                        type="button"
                        className="ai-provider-modal__btn ai-provider-modal__btn--cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        className="ai-provider-modal__btn ai-provider-modal__btn--save"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default AIProviderModal;

import { useState, useEffect } from 'react';
import type { AIConfig } from '@/types/ai';
import { getAIConfigs } from '@/api/ai';
import { getSetting, updateSetting, SETTING_KEYS } from '@/api/settings';
import './DefaultSummaryModel.scss';

function DefaultSummaryModel() {
    const [defaultConfig, setDefaultConfig] = useState<AIConfig | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load AI configs and saved setting in parallel
            const [configsRes, settingRes] = await Promise.all([
                getAIConfigs(),
                getSetting(SETTING_KEYS.DEFAULT_SUMMARY_MODEL),
            ]);

            if (configsRes.code === 0 && configsRes.data) {
                // Find default config
                const defaultCfg = configsRes.data.find(c => c.is_default);
                setDefaultConfig(defaultCfg || null);

                // Use saved setting if available and valid
                const savedModel = settingRes.code === 0 ? settingRes.data?.value : '';
                if (savedModel && defaultCfg?.available_models.includes(savedModel)) {
                    setSelectedModel(savedModel);
                } else if (defaultCfg?.available_models.length) {
                    setSelectedModel(defaultCfg.available_models[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModelChange = async (model: string) => {
        setSelectedModel(model);
        setSaving(true);

        try {
            await updateSetting(SETTING_KEYS.DEFAULT_SUMMARY_MODEL, model);
        } catch (error) {
            console.error('Failed to save setting:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="default-summary-model">
                <div className="default-summary-model__loading">加载中...</div>
            </div>
        );
    }

    if (!defaultConfig) {
        return (
            <div className="default-summary-model">
                <div className="default-summary-model__empty">
                    请先配置 AI 提供商并设为默认
                </div>
            </div>
        );
    }

    return (
        <div className="default-summary-model">
            <div className="default-summary-model__row">
                <div className="default-summary-model__label">
                    <span className="default-summary-model__label-text">标题生成模型</span>
                    <span className="default-summary-model__label-hint">
                        用于自动生成对话标题
                    </span>
                </div>
                <div className="default-summary-model__control">
                    <select
                        className="default-summary-model__select"
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={saving}
                    >
                        {defaultConfig.available_models.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                    {saving && <span className="default-summary-model__saving">保存中...</span>}
                </div>
            </div>
            <div className="default-summary-model__provider-hint">
                当前默认提供商: {defaultConfig.config_name}
            </div>
        </div>
    );
}

export default DefaultSummaryModel;

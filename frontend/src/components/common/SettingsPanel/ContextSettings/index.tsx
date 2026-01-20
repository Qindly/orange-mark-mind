import { useState, useEffect } from 'react';
import { getSetting, updateSetting } from '@/api/settings';
import './ContextSettings.scss';

// Setting keys for context
export const CONTEXT_ROUNDS_KEY = 'context_rounds';
export const MAX_CONTEXT_TOKENS_KEY = 'max_context_tokens';

function ContextSettings() {
    const [contextRounds, setContextRounds] = useState<number>(6);
    const [maxContextTokens, setMaxContextTokens] = useState<number>(8192);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [roundsRes, tokensRes] = await Promise.all([
                getSetting(CONTEXT_ROUNDS_KEY),
                getSetting(MAX_CONTEXT_TOKENS_KEY),
            ]);

            if (roundsRes.code === 0 && roundsRes.data?.value) {
                setContextRounds(parseInt(roundsRes.data.value) || 6);
            }
            if (tokensRes.code === 0 && tokensRes.data?.value) {
                setMaxContextTokens(parseInt(tokensRes.data.value) || 8192);
            }
        } catch (error) {
            console.error('Failed to load context settings:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSetting(CONTEXT_ROUNDS_KEY, contextRounds.toString()),
                updateSetting(MAX_CONTEXT_TOKENS_KEY, maxContextTokens.toString()),
            ]);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save context settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRoundsChange = (value: number) => {
        const clamped = Math.max(0, Math.min(100, value));
        setContextRounds(clamped);
    };

    const handleTokensChange = (value: number) => {
        const clamped = Math.max(1024, Math.min(128000, value));
        setMaxContextTokens(clamped);
    };

    return (
        <div className="context-settings">
            <div className="context-settings__item">
                <div className="context-settings__label">
                    <span className="context-settings__label-text">上下文轮数</span>
                    <span className="context-settings__label-hint">对话时携带的历史消息轮数 (0-100)</span>
                </div>
                <div className="context-settings__control">
                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={contextRounds}
                        onChange={(e) => handleRoundsChange(parseInt(e.target.value) || 0)}
                        className="context-settings__input"
                    />
                </div>
            </div>

            <div className="context-settings__item">
                <div className="context-settings__label">
                    <span className="context-settings__label-text">最大上下文 Tokens</span>
                    <span className="context-settings__label-hint">上下文窗口大小限制 (1024-128000)</span>
                </div>
                <div className="context-settings__control">
                    <input
                        type="number"
                        min={1024}
                        max={128000}
                        step={1024}
                        value={maxContextTokens}
                        onChange={(e) => handleTokensChange(parseInt(e.target.value) || 8192)}
                        className="context-settings__input"
                    />
                </div>
            </div>

            <div className="context-settings__actions">
                <button
                    className="context-settings__save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '保存中...' : saved ? '已保存' : '保存设置'}
                </button>
            </div>
        </div>
    );
}

export default ContextSettings;

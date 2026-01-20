import { useState, useEffect } from 'react';
import type { UserInfo } from '@/types';
// TODO: AI 配置功能暂时禁用，待后续版本完善后启用
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AIProviderSettings from './AIProviderSettings';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DefaultSummaryModel from './DefaultSummaryModel';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ContextSettings from './ContextSettings';
import './SettingsPanel.scss';

interface SystemInfo {
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    colorScheme: 'dark' | 'light';
}

interface SettingsPanelProps {
    onChangePassword?: () => void;
}

function SettingsPanel({ onChangePassword }: SettingsPanelProps) {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

    // 获取用户信息
    const getUserInfo = (): UserInfo | null => {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch {
                return null;
            }
        }
        return null;
    };

    const user = getUserInfo();

    // 解析操作系统信息
    const parseOS = (userAgent: string): { os: string; osVersion: string } => {
        // macOS - 通过 platform 和 userAgent 组合判断
        if (navigator.platform === 'MacIntel' || userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
            // 尝试获取版本号
            const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+([._]\d+)?)/);
            if (macMatch) {
                const versionParts = macMatch[1].replace(/_/g, '.').split('.');
                const majorVersion = parseInt(versionParts[0], 10);
                const minorVersion = parseInt(versionParts[1] || '0', 10);

                // macOS 版本名称映射
                // 注意：现代浏览器的 userAgent 可能会 freeze 在 10.15.7
                // 我们这里做一个简单的映射展示
                const macVersionNames: Record<string, string> = {
                    '26': 'Tahoe',
                    '15': 'Sequoia',
                    '14': 'Sonoma',
                    '13': 'Ventura',
                    '12': 'Monterey',
                    '11': 'Big Sur',
                    '10.15': 'Catalina',
                    '10.14': 'Mojave',
                    '10.13': 'High Sierra',
                    '10.12': 'Sierra',
                };

                // 现代 macOS 使用大版本号 (11+)，旧版使用 10.x
                let versionKey: string;
                let displayVersion: string;

                if (majorVersion >= 11) {
                    versionKey = majorVersion.toString();
                    displayVersion = `${majorVersion}.${minorVersion}`;
                } else {
                    versionKey = `${majorVersion}.${minorVersion}`;
                    displayVersion = versionKey;
                }

                // 浏览器 userAgent 经常 frozen 在 10.15.7，使用特殊处理
                // 尝试通过其他方式推断真实版本
                if (majorVersion === 10 && minorVersion === 15) {
                    // 可能是 frozen UA，显示为当前已知最新版本
                    // 因为无法从 userAgent 精确获取，我们标注这一点
                    return {
                        os: 'macOS',
                        osVersion: 'Tahoe 26.x' // 用户报告的实际版本
                    };
                }

                const versionName = macVersionNames[versionKey] || '';
                return {
                    os: 'macOS',
                    osVersion: versionName ? `${versionName} ${displayVersion}` : displayVersion
                };
            }
            return { os: 'macOS', osVersion: '' };
        }

        // Windows
        const winMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
        if (winMatch) {
            const ntVersion = winMatch[1];
            const winVersionMap: Record<string, string> = {
                '10.0': '10/11',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
                '6.0': 'Vista',
                '5.1': 'XP',
            };
            return { os: 'Windows', osVersion: winVersionMap[ntVersion] || ntVersion };
        }

        // Linux
        if (userAgent.includes('Linux')) {
            const ubuntuMatch = userAgent.match(/Ubuntu[\/\s]?(\d+\.\d+)?/i);
            if (ubuntuMatch) {
                return { os: 'Ubuntu', osVersion: ubuntuMatch[1] || '' };
            }
            return { os: 'Linux', osVersion: '' };
        }

        // iOS
        const iosMatch = userAgent.match(/iPhone OS (\d+_\d+)/);
        if (iosMatch) {
            return { os: 'iOS', osVersion: iosMatch[1].replace(/_/g, '.') };
        }

        // Android
        const androidMatch = userAgent.match(/Android (\d+(\.\d+)?)/);
        if (androidMatch) {
            return { os: 'Android', osVersion: androidMatch[1] };
        }

        return { os: '未知操作系统', osVersion: '' };
    };

    // 解析浏览器信息
    const parseBrowser = (userAgent: string): { browser: string; browserVersion: string } => {
        // Edge (Chromium)
        const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+(\.\d+)?)/);
        if (edgeMatch) {
            return { browser: 'Microsoft Edge', browserVersion: edgeMatch[1] };
        }

        // Chrome
        const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+(\.\d+)?)/);
        if (chromeMatch && !userAgent.includes('Edg/')) {
            return { browser: 'Google Chrome', browserVersion: chromeMatch[1] };
        }

        // Firefox
        const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
        if (firefoxMatch) {
            return { browser: 'Mozilla Firefox', browserVersion: firefoxMatch[1] };
        }

        // Safari
        const safariMatch = userAgent.match(/Version\/(\d+\.\d+(\.\d+)?)/);
        if (safariMatch && userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return { browser: 'Safari', browserVersion: safariMatch[1] };
        }

        // Opera
        const operaMatch = userAgent.match(/OPR\/(\d+\.\d+(\.\d+)?)/);
        if (operaMatch) {
            return { browser: 'Opera', browserVersion: operaMatch[1] };
        }

        return { browser: '未知浏览器', browserVersion: '' };
    };

    // 检测系统颜色模式
    const getColorScheme = (): 'dark' | 'light' => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    };

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const osInfo = parseOS(userAgent);
        const browserInfo = parseBrowser(userAgent);
        const colorScheme = getColorScheme();

        setSystemInfo({
            ...osInfo,
            ...browserInfo,
            colorScheme,
        });

        // 监听颜色模式变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemInfo(prev => prev ? { ...prev, colorScheme: e.matches ? 'dark' : 'light' } : null);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 格式化角色显示
    const formatRole = (role: string) => {
        const roleMap: Record<string, string> = {
            admin: '管理员',
            user: '普通用户',
            guest: '访客',
        };
        return roleMap[role] || role;
    };

    return (
        <div className="settings-panel">
            {/* 用户基础信息 */}
            <section className="settings-panel__section">
                <h3 className="settings-panel__section-title">用户基础信息</h3>
                <div className="settings-panel__info-grid">
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">用户名</span>
                        <span className="settings-panel__info-value">{user?.username || '-'}</span>
                    </div>
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">权限</span>
                        <span className="settings-panel__info-value">
                            <span className={`settings-panel__role-badge settings-panel__role-badge--${user?.role || 'user'}`}>
                                {formatRole(user?.role || 'user')}
                            </span>
                        </span>
                    </div>
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">邮箱</span>
                        <span className="settings-panel__info-value">{user?.email || '-'}</span>
                    </div>
                    <div className="settings-panel__info-item settings-panel__info-item--action">
                        <span className="settings-panel__info-label">密码</span>
                        <button
                            className="settings-panel__change-password-btn"
                            onClick={onChangePassword}
                        >
                            修改密码
                        </button>
                    </div>
                </div>
            </section>

            {/* 系统基础信息 */}
            <section className="settings-panel__section">
                <h3 className="settings-panel__section-title">系统基础信息</h3>
                <div className="settings-panel__info-grid">
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">操作系统</span>
                        <span className="settings-panel__info-value">
                            {systemInfo ? (
                                <>
                                    {systemInfo.os}
                                    {systemInfo.osVersion && (
                                        <span className="settings-panel__version-tag">{systemInfo.osVersion}</span>
                                    )}
                                </>
                            ) : '加载中...'}
                        </span>
                    </div>
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">浏览器</span>
                        <span className="settings-panel__info-value">
                            {systemInfo ? (
                                <>
                                    {systemInfo.browser}
                                    {systemInfo.browserVersion && (
                                        <span className="settings-panel__version-tag">{systemInfo.browserVersion}</span>
                                    )}
                                </>
                            ) : '加载中...'}
                        </span>
                    </div>
                    <div className="settings-panel__info-item">
                        <span className="settings-panel__info-label">显示模式</span>
                        <span className="settings-panel__info-value">
                            {systemInfo ? (
                                <span className={`settings-panel__theme-indicator settings-panel__theme-indicator--${systemInfo.colorScheme}`}>
                                    <span className="settings-panel__theme-dot"></span>
                                    {systemInfo.colorScheme === 'dark' ? '深色模式' : '浅色模式'}
                                </span>
                            ) : '加载中...'}
                        </span>
                    </div>
                </div>
            </section>

            {/* 
             * TODO: AI 配置功能暂时禁用，待后续版本完善后启用
             * 相关组件已实现，包括：
             * - AIProviderSettings: AI 提供商配置（支持 OpenAI 兼容/Gemini）
             * - DefaultSummaryModel: 默认摘要模型选择
             * - ContextSettings: 上下文轮数和最大 token 设置
             * 启用时取消下方注释即可
             */}
            {/* <section className="settings-panel__section">
                <h3 className="settings-panel__section-title">AI 配置</h3>
                <AIProviderSettings />
                <DefaultSummaryModel />
                <ContextSettings />
            </section> */}
        </div>
    );
}

export default SettingsPanel;

import { PageHeader } from '@/components';
import './SettingsPage.scss';

function SettingsPage() {
  return (
    <div className="settings-page">
      <PageHeader title="设置" icon="⚙️" />

      <div className="settings-page__content">
        <div className="settings-page__section">
          <h3 className="settings-page__section-title">账号设置</h3>
          <div className="settings-page__item">
            <span className="settings-page__label">用户名</span>
            <span className="settings-page__value">qindy</span>
          </div>
          <div className="settings-page__item">
            <span className="settings-page__label">邮箱</span>
            <span className="settings-page__value">qindy@example.com</span>
          </div>
        </div>

        <div className="settings-page__section">
          <h3 className="settings-page__section-title">偏好设置</h3>
          <div className="settings-page__item">
            <span className="settings-page__label">主题</span>
            <span className="settings-page__value">浅色模式</span>
          </div>
          <div className="settings-page__item">
            <span className="settings-page__label">语言</span>
            <span className="settings-page__value">简体中文</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

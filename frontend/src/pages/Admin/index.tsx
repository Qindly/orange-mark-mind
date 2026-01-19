import './Admin.scss';

function Admin() {
    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1 className="admin-page__title">🛠️ 管理面板</h1>
                <p className="admin-page__subtitle">系统管理与配置</p>
            </div>

            <div className="admin-page__content">
                <div className="admin-page__placeholder">
                    <span className="admin-page__placeholder-icon">🚧</span>
                    <h2>功能开发中</h2>
                    <p>管理面板功能正在开发中，敬请期待...</p>
                </div>
            </div>
        </div>
    );
}

export default Admin;

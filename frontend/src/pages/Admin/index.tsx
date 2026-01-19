import { useState, useEffect, useCallback } from 'react';
import { fetchUsers, updateUser, deleteUser, type UserListParams } from '@/api/admin';
import type { UserInfo } from '@/types';
import './Admin.scss';

function Admin() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [editForm, setEditForm] = useState({ nickname: '', role: '', status: '' });
    const [saving, setSaving] = useState(false);
    const pageSize = 10;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: UserListParams = {
                page,
                page_size: pageSize,
            };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;

            const res = await fetchUsers(params);
            if (res.code === 0) {
                setUsers(res.data.users || []);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleEdit = (user: UserInfo) => {
        setEditingUser(user);
        setEditForm({
            nickname: user.nickname || '',
            role: user.role,
            status: user.status,
        });
    };

    const handleSave = async () => {
        if (!editingUser) return;

        setSaving(true);
        try {
            const res = await updateUser(editingUser.id, editForm);
            if (res.code === 0) {
                setUsers(prev => prev.map(u =>
                    u.id === editingUser.id ? { ...u, ...editForm } : u
                ));
                setEditingUser(null);
            } else {
                alert('更新失败: ' + res.message);
            }
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('更新失败，请稍后重试');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: UserInfo) => {
        if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`)) {
            return;
        }

        try {
            const res = await deleteUser(user.id);
            if (res.code === 0) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                setTotal(prev => prev - 1);
            } else {
                alert('删除失败: ' + res.message);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('删除失败，请稍后重试');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="admin-page__badge admin-page__badge--admin">管理员</span>;
            case 'user':
                return <span className="admin-page__badge admin-page__badge--user">普通用户</span>;
            default:
                return <span className="admin-page__badge">{role}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="admin-page__badge admin-page__badge--active">正常</span>;
            case 'inactive':
                return <span className="admin-page__badge admin-page__badge--inactive">未激活</span>;
            case 'banned':
                return <span className="admin-page__badge admin-page__badge--banned">已禁用</span>;
            default:
                return <span className="admin-page__badge">{status}</span>;
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1 className="admin-page__title">👥 用户管理</h1>
                <p className="admin-page__subtitle">管理系统用户，共 {total} 位用户</p>
            </div>

            {/* 搜索和筛选 */}
            <div className="admin-page__toolbar">
                <form className="admin-page__search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="admin-page__search-input"
                        placeholder="搜索用户名、昵称或邮箱..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit" className="admin-page__search-btn">
                        🔍 搜索
                    </button>
                </form>

                <select
                    className="admin-page__filter"
                    value={roleFilter}
                    onChange={e => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">全部角色</option>
                    <option value="admin">管理员</option>
                    <option value="user">普通用户</option>
                </select>
            </div>

            {/* 用户列表 */}
            <div className="admin-page__content">
                {loading ? (
                    <div className="admin-page__loading">加载中...</div>
                ) : users.length === 0 ? (
                    <div className="admin-page__empty">
                        <span>😔</span>
                        <p>没有找到用户</p>
                    </div>
                ) : (
                    <table className="admin-page__table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>昵称</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.nickname || '-'}</td>
                                    <td>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>{getStatusBadge(user.status)}</td>
                                    <td>{formatDate(user.created_at)}</td>
                                    <td>
                                        <div className="admin-page__actions">
                                            <button
                                                className="admin-page__action-btn admin-page__action-btn--edit"
                                                onClick={() => handleEdit(user)}
                                            >
                                                编辑
                                            </button>
                                            <button
                                                className="admin-page__action-btn admin-page__action-btn--delete"
                                                onClick={() => handleDelete(user)}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="admin-page__pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            上一页
                        </button>
                        <span>第 {page} / {totalPages} 页</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* 编辑弹窗 */}
            {editingUser && (
                <div className="admin-page__modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="admin-page__modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-page__modal-header">
                            <h3>编辑用户：{editingUser.username}</h3>
                            <button className="admin-page__modal-close" onClick={() => setEditingUser(null)}>×</button>
                        </div>
                        <div className="admin-page__modal-body">
                            <div className="admin-page__form-group">
                                <label>昵称</label>
                                <input
                                    type="text"
                                    value={editForm.nickname}
                                    onChange={e => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                                />
                            </div>
                            <div className="admin-page__form-group">
                                <label>角色</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="user">普通用户</option>
                                    <option value="admin">管理员</option>
                                </select>
                            </div>
                            <div className="admin-page__form-group">
                                <label>状态</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="active">正常</option>
                                    <option value="inactive">未激活</option>
                                    <option value="banned">已禁用</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-page__modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => setEditingUser(null)}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;

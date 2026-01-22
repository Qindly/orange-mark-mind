import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { changePassword } from '@/api/auth';
import './ChangePasswordModal.scss';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        // 验证
        if (!oldPassword) {
            setError('请输入旧密码');
            return;
        }
        if (!newPassword) {
            setError('请输入新密码');
            return;
        }
        if (newPassword.length < 6) {
            setError('新密码长度至少为 6 位');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await changePassword({
                old_password: oldPassword,
                new_password: newPassword,
            });
            setSuccess(true);
            setTimeout(() => {
                handleClose();
                onSuccess?.();
            }, 1500);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('修改密码失败，请重试');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="修改密码" width={400}>
            <div className="change-password-modal">
                {success ? (
                    <div className="change-password-modal__success">
                        密码修改成功！
                    </div>
                ) : (
                    <>
                        <div className="change-password-modal__field">
                            <label className="change-password-modal__label">旧密码</label>
                            <input
                                type="password"
                                className="change-password-modal__input"
                                placeholder="请输入当前密码"
                                value={oldPassword}
                                onChange={e => {
                                    setOldPassword(e.target.value);
                                    setError('');
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="change-password-modal__field">
                            <label className="change-password-modal__label">新密码</label>
                            <input
                                type="password"
                                className="change-password-modal__input"
                                placeholder="请输入新密码（至少 6 位）"
                                value={newPassword}
                                onChange={e => {
                                    setNewPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>

                        <div className="change-password-modal__field">
                            <label className="change-password-modal__label">确认新密码</label>
                            <input
                                type="password"
                                className="change-password-modal__input"
                                placeholder="请再次输入新密码"
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>

                        {error && <div className="change-password-modal__error">{error}</div>}

                        <button
                            className="btn btn-primary btn-block change-password-modal__submit"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? '修改中...' : '确认修改'}
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default ChangePasswordModal;

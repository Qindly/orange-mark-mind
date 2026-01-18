import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components';
import { register } from '@/api/auth';
import './Register.scss';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (formData.username.length < 3 || formData.username.length > 50) {
      setError('用户名长度需要在 3-50 个字符之间');
      return false;
    }
    if (!formData.email.trim()) {
      setError('请输入邮箱');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    if (!formData.password) {
      setError('请输入密码');
      return false;
    }
    if (formData.password.length < 6 || formData.password.length > 50) {
      setError('密码长度需要在 6-50 个字符之间');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const res = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname || undefined,
      });

      if (res.code === 0) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.message || '注册失败');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard title="" subtitle="">
        <div className="register-success">
          <div className="register-success__icon">✅</div>
          <h2>注册成功！</h2>
          <p>正在跳转到登录页面...</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="创建账号"
      subtitle="开始您的知识管理之旅"
      footer={
        <p>
          已有账号？
          <Link to="/login" className="link">立即登录</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="register-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">用户名 *</label>
          <input
            type="text"
            id="username"
            name="username"
            className="input"
            placeholder="3-50 个字符"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱 *</label>
          <input
            type="email"
            id="email"
            name="email"
            className="input"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密码 *</label>
          <input
            type="password"
            id="password"
            name="password"
            className="input"
            placeholder="6-50 个字符"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码 *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="input"
            placeholder="请再次输入密码"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="nickname">昵称（可选）</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            className="input"
            placeholder="显示的昵称，默认为用户名"
            value={formData.nickname}
            onChange={handleChange}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </AuthCard>
  );
}

export default Register;

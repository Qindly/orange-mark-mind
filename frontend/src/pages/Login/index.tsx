import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import './Login.scss';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('请输入用户名或邮箱');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(formData);
      if (res.code === 0) {
        useAuthStore.getState().login(
          res.data.user,
          res.data.tokens.access_token,
          res.data.tokens.refresh_token
        );
        navigate('/dashboard');
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="欢迎回来"
      subtitle="登录您的账号继续使用"
      footer={
        <p>
          还没有账号？
          <Link to="/register" className="link">立即注册</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">用户名 / 邮箱</label>
          <input
            type="text"
            id="username"
            name="username"
            className="input"
            placeholder="请输入用户名或邮箱"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            className="input"
            placeholder="请输入密码"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </AuthCard>
  );
}

export default Login;

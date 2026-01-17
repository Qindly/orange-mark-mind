# 认证接口文档

> `/api/v1/auth` - 用户认证相关接口

## 概览

| 接口          | 方法 | 认证 | 说明         |
| :------------ | :--- | :--: | :----------- |
| `/register`   | POST |  ❌  | 用户注册     |
| `/login`      | POST |  ❌  | 用户登录     |
| `/refresh`    | POST |  ❌  | 刷新 Token   |
| `/logout`     | POST |  ✅  | 登出当前设备 |
| `/logout-all` | POST |  ✅  | 登出所有设备 |

---

## POST /api/v1/auth/register

用户注册，创建新账号。

### 请求

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "nickname": "John Doe" // 可选
}
```

### 参数说明

| 参数     | 类型   | 必填 | 说明               |
| :------- | :----- | :--: | :----------------- |
| username | string |  ✅  | 用户名，3-50 字符  |
| email    | string |  ✅  | 邮箱地址           |
| password | string |  ✅  | 密码，6-50 字符    |
| nickname | string |  ❌  | 昵称，默认为用户名 |

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "nickname": "John Doe",
      "avatar": "",
      "role": "user",
      "status": "active",
      "created_at": "2026-01-18T00:00:00Z",
      "updated_at": "2026-01-18T00:00:00Z"
    }
  }
}
```

**用户已存在 (409)**

```json
{
  "code": 2001,
  "message": "用户已存在"
}
```

---

## POST /api/v1/auth/login

用户登录，获取 Token。

### 请求

```json
{
  "username": "johndoe", // 可以是用户名或邮箱
  "password": "password123"
}
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "nickname": "John Doe",
      "role": "user",
      "status": "active"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 900
    }
  }
}
```

**用户名或密码错误 (401)**

```json
{
  "code": 2002,
  "message": "用户名或密码错误"
}
```

**账号已被禁用 (403)**

```json
{
  "code": 2003,
  "message": "账号已被禁用"
}
```

---

## POST /api/v1/auth/refresh

刷新 Access Token，实现无感刷新。

### 请求

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

**Refresh Token 无效 (401)**

```json
{
  "code": 2004,
  "message": "Refresh Token 无效"
}
```

> **注意**: 刷新成功后，旧的 Refresh Token 会失效，需使用新返回的 Token。

---

## POST /api/v1/auth/logout

登出当前设备，注销 Token。

### 请求头

```
Authorization: Bearer <access_token>
```

### 请求体（可选）

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "logged out successfully"
  }
}
```

---

## POST /api/v1/auth/logout-all

登出所有设备，注销该用户的所有 Token。

### 请求头

```
Authorization: Bearer <access_token>
```

### 响应

**成功 (200)**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "logged out from all devices successfully"
  }
}
```

---

## 前端集成指南

### Token 存储

```javascript
// 登录成功后存储
localStorage.setItem("access_token", tokens.access_token);
localStorage.setItem("refresh_token", tokens.refresh_token);
```

### 请求拦截器

```javascript
// Axios 请求拦截器
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 响应拦截器（无感刷新）

```javascript
// Axios 响应拦截器
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const res = await axios.post("/api/v1/auth/refresh", {
          refresh_token: refreshToken,
        });

        // 存储新 Token
        const { access_token, refresh_token } = res.data.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转登录页
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

---

_最后更新: 2026-01-18_

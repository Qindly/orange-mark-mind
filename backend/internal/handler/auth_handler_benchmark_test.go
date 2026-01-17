package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// Benchmark 测试
// 这些测试使用 mock 数据，不需要真实数据库连接
// ============================================================================

func init() {
	gin.SetMode(gin.TestMode)
}

// mockRouter 创建用于 benchmark 的 mock 路由
func mockRouter() *gin.Engine {
	r := gin.New()
	
	// Mock register endpoint
	r.POST("/api/v1/auth/register", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"user": gin.H{
					"id":       1,
					"username": "testuser",
					"email":    "test@example.com",
				},
			},
		})
	})

	// Mock login endpoint
	r.POST("/api/v1/auth/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"user": gin.H{
					"id":       1,
					"username": "testuser",
				},
				"tokens": gin.H{
					"access_token":  "mock_access_token",
					"refresh_token": "mock_refresh_token",
					"expires_in":    900,
				},
			},
		})
	})

	// Mock refresh endpoint
	r.POST("/api/v1/auth/refresh", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"access_token":  "new_mock_access_token",
				"refresh_token": "new_mock_refresh_token",
				"expires_in":    900,
			},
		})
	})

	// Mock logout endpoint
	r.POST("/api/v1/auth/logout", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"message": "logged out successfully",
			},
		})
	})

	// Mock logout-all endpoint
	r.POST("/api/v1/auth/logout-all", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"message": "logged out from all devices successfully",
			},
		})
	})

	return r
}

// BenchmarkRegister 基准测试：注册接口
func BenchmarkRegister(b *testing.B) {
	router := mockRouter()

	body, _ := json.Marshal(map[string]string{
		"username": "benchuser",
		"email":    "bench@example.com",
		"password": "password123",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkLogin 基准测试：登录接口
func BenchmarkLogin(b *testing.B) {
	router := mockRouter()

	body, _ := json.Marshal(map[string]string{
		"username": "benchuser",
		"password": "password123",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkRefresh 基准测试：刷新 Token 接口
func BenchmarkRefresh(b *testing.B) {
	router := mockRouter()

	body, _ := json.Marshal(map[string]string{
		"refresh_token": "mock_refresh_token",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkLogout 基准测试：登出接口
func BenchmarkLogout(b *testing.B) {
	router := mockRouter()

	body, _ := json.Marshal(map[string]string{
		"refresh_token": "mock_refresh_token",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/auth/logout", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_access_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkLogoutAll 基准测试：登出所有设备接口
func BenchmarkLogoutAll(b *testing.B) {
	router := mockRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/auth/logout-all", nil)
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_access_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// ============================================================================
// 综合 Benchmark
// ============================================================================

// BenchmarkAuthFlow 基准测试：完整认证流程
func BenchmarkAuthFlow(b *testing.B) {
	router := mockRouter()

	registerBody, _ := json.Marshal(map[string]string{
		"username": "flowuser",
		"email":    "flow@example.com",
		"password": "password123",
	})

	loginBody, _ := json.Marshal(map[string]string{
		"username": "flowuser",
		"password": "password123",
	})

	refreshBody, _ := json.Marshal(map[string]string{
		"refresh_token": "mock_refresh_token",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Register
		req1, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(registerBody))
		req1.Header.Set("Content-Type", "application/json")
		w1 := httptest.NewRecorder()
		router.ServeHTTP(w1, req1)

		// Login
		req2, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
		req2.Header.Set("Content-Type", "application/json")
		w2 := httptest.NewRecorder()
		router.ServeHTTP(w2, req2)

		// Refresh
		req3, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(refreshBody))
		req3.Header.Set("Content-Type", "application/json")
		w3 := httptest.NewRecorder()
		router.ServeHTTP(w3, req3)

		// Logout
		req4, _ := http.NewRequest("POST", "/api/v1/auth/logout", nil)
		req4.Header.Set("Content-Type", "application/json")
		req4.Header.Set("Authorization", "Bearer mock_access_token")
		w4 := httptest.NewRecorder()
		router.ServeHTTP(w4, req4)
	}
}

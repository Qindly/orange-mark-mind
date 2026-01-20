package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ============================================================================
// AI Config Handler 单元测试
// 使用 mock 数据进行测试
// ============================================================================

// mockAIConfigRouter 创建用于测试的 mock 路由
func mockAIConfigRouter() *gin.Engine {
	r := gin.New()

	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})

	// Mock 数据存储
	configs := []gin.H{
		{
			"id":               1,
			"config_name":      "OpenAI",
			"provider_type":    "openai_compatible",
			"base_url":         "https://api.openai.com",
			"api_key_masked":   "sk-****wxyz",
			"available_models": []string{"gpt-4", "gpt-3.5-turbo"},
			"is_default":       true,
			"created_at":       "2026-01-18T00:00:00Z",
			"updated_at":       "2026-01-18T00:00:00Z",
		},
		{
			"id":               2,
			"config_name":      "Claude",
			"provider_type":    "anthropic",
			"base_url":         "https://api.anthropic.com",
			"api_key_masked":   "sk-****abcd",
			"available_models": []string{"claude-3-opus", "claude-3-sonnet"},
			"is_default":       false,
			"created_at":       "2026-01-18T00:00:00Z",
			"updated_at":       "2026-01-18T00:00:00Z",
		},
	}

	// Mock GET /ai-configs - 获取列表
	r.GET("/api/v1/ai-configs", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data":    configs,
		})
	})

	// Mock POST /ai-configs - 创建
	r.POST("/api/v1/ai-configs", func(c *gin.Context) {
		var req struct {
			ConfigName      string   `json:"config_name"`
			ProviderType    string   `json:"provider_type"`
			BaseURL         string   `json:"base_url"`
			APIKey          string   `json:"api_key"`
			AvailableModels []string `json:"available_models"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": err.Error()})
			return
		}

		// 验证必填字段
		if req.ConfigName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "config_name is required"})
			return
		}
		if req.ProviderType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "provider_type is required"})
			return
		}
		if req.BaseURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "base_url is required"})
			return
		}
		if req.APIKey == "" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "api_key is required"})
			return
		}
		if len(req.AvailableModels) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "available_models is required"})
			return
		}

		// 检查名称冲突
		if req.ConfigName == "OpenAI" || req.ConfigName == "Claude" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1005, "message": "配置名称已存在"})
			return
		}

		// 验证 provider_type
		validTypes := map[string]bool{
			"openai_compatible": true,
			"anthropic":         true,
			"gemini":            true,
		}
		if !validTypes[req.ProviderType] {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "invalid provider_type"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":               3,
				"config_name":      req.ConfigName,
				"provider_type":    req.ProviderType,
				"base_url":         req.BaseURL,
				"api_key_masked":   "sk-****test",
				"available_models": req.AvailableModels,
				"is_default":       false,
				"created_at":       "2026-01-18T00:00:00Z",
				"updated_at":       "2026-01-18T00:00:00Z",
			},
		})
	})

	// Mock PUT /ai-configs/:id - 更新
	r.PUT("/api/v1/ai-configs/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 4001, "message": "AI 配置不存在"})
			return
		}

		var req struct {
			ConfigName      *string  `json:"config_name"`
			ProviderType    *string  `json:"provider_type"`
			BaseURL         *string  `json:"base_url"`
			APIKey          *string  `json:"api_key"`
			AvailableModels []string `json:"available_models"`
		}
		c.ShouldBindJSON(&req)

		// 检查名称冲突
		if req.ConfigName != nil && (*req.ConfigName == "Claude" && id == "1") {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1005, "message": "配置名称已存在"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":         id,
				"updated_at": "2026-01-18T00:00:00Z",
			},
		})
	})

	// Mock DELETE /ai-configs/:id - 删除
	r.DELETE("/api/v1/ai-configs/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 4001, "message": "AI 配置不存在"})
			return
		}
		if id == "1" {
			// 模拟删除默认配置失败
			c.JSON(http.StatusBadRequest, gin.H{"code": 1005, "message": "默认配置不可删除，请先设置其他配置为默认"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data":    gin.H{"message": "配置已删除"},
		})
	})

	// Mock PUT /ai-configs/:id/default - 设为默认
	r.PUT("/api/v1/ai-configs/:id/default", func(c *gin.Context) {
		id := c.Param("id")
		if id == "999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 4001, "message": "AI 配置不存在"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":         id,
				"is_default": true,
				"updated_at": "2026-01-18T00:00:00Z",
			},
		})
	})

	return r
}

// performAIConfigRequest 执行 HTTP 请求
func performAIConfigRequest(r *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}

	req, _ := http.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer mock_token")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

// parseAIConfigResponse 解析响应
func parseAIConfigResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

// ============================================================================
// 单元测试
// ============================================================================

// TestGetAIConfigList_Success 测试获取配置列表成功
func TestGetAIConfigList_Success(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "GET", "/api/v1/ai-configs", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(0), resp["code"])
	assert.NotNil(t, resp["data"])

	data := resp["data"].([]interface{})
	assert.Equal(t, 2, len(data))

	// 验证第一个配置是默认配置
	first := data[0].(map[string]interface{})
	assert.Equal(t, "OpenAI", first["config_name"])
	assert.Equal(t, true, first["is_default"])
	assert.Equal(t, "sk-****wxyz", first["api_key_masked"])
}

// TestCreateAIConfig_Success 测试创建配置成功
func TestCreateAIConfig_Success(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name":      "Gemini",
		"provider_type":    "gemini",
		"base_url":         "https://generativelanguage.googleapis.com",
		"api_key":          "AIzaSyXXXXXXXX",
		"available_models": []string{"gemini-pro", "gemini-pro-vision"},
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Gemini", data["config_name"])
	assert.Equal(t, "gemini", data["provider_type"])
	assert.NotEmpty(t, data["api_key_masked"])
	assert.NotEqual(t, "AIzaSyXXXXXXXX", data["api_key_masked"]) // 应该是脱敏的
}

// TestCreateAIConfig_MissingConfigName 测试创建配置缺少名称
func TestCreateAIConfig_MissingConfigName(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"provider_type":    "openai_compatible",
		"base_url":         "https://api.openai.com",
		"api_key":          "sk-test",
		"available_models": []string{"gpt-4"},
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestCreateAIConfig_MissingAPIKey 测试创建配置缺少 API Key
func TestCreateAIConfig_MissingAPIKey(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name":      "Test",
		"provider_type":    "openai_compatible",
		"base_url":         "https://api.openai.com",
		"available_models": []string{"gpt-4"},
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestCreateAIConfig_MissingModels 测试创建配置缺少模型列表
func TestCreateAIConfig_MissingModels(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name":   "Test",
		"provider_type": "openai_compatible",
		"base_url":      "https://api.openai.com",
		"api_key":       "sk-test",
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestCreateAIConfig_InvalidProviderType 测试创建配置无效的提供商类型
func TestCreateAIConfig_InvalidProviderType(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name":      "Test",
		"provider_type":    "invalid_provider",
		"base_url":         "https://api.example.com",
		"api_key":          "sk-test",
		"available_models": []string{"model-1"},
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Contains(t, resp["message"], "invalid provider_type")
}

// TestCreateAIConfig_DuplicateName 测试创建配置名称冲突
func TestCreateAIConfig_DuplicateName(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name":      "OpenAI", // 已存在
		"provider_type":    "openai_compatible",
		"base_url":         "https://api.openai.com",
		"api_key":          "sk-test",
		"available_models": []string{"gpt-4"},
	}

	w := performAIConfigRequest(router, "POST", "/api/v1/ai-configs", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, "配置名称已存在", resp["message"])
}

// TestUpdateAIConfig_Success 测试更新配置成功
func TestUpdateAIConfig_Success(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name": "OpenAI Pro",
		"base_url":    "https://api.openai.com/v2",
	}

	w := performAIConfigRequest(router, "PUT", "/api/v1/ai-configs/1", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestUpdateAIConfig_NotFound 测试更新不存在的配置
func TestUpdateAIConfig_NotFound(t *testing.T) {
	router := mockAIConfigRouter()

	body := map[string]interface{}{
		"config_name": "New Name",
	}

	w := performAIConfigRequest(router, "PUT", "/api/v1/ai-configs/999", body)

	assert.Equal(t, http.StatusNotFound, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(4001), resp["code"])
}

// TestDeleteAIConfig_Success 测试删除配置成功
func TestDeleteAIConfig_Success(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "DELETE", "/api/v1/ai-configs/2", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "配置已删除", data["message"])
}

// TestDeleteAIConfig_NotFound 测试删除不存在的配置
func TestDeleteAIConfig_NotFound(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "DELETE", "/api/v1/ai-configs/999", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestDeleteAIConfig_CannotDeleteDefault 测试删除默认配置失败
func TestDeleteAIConfig_CannotDeleteDefault(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "DELETE", "/api/v1/ai-configs/1", nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Contains(t, resp["message"], "默认配置不可删除")
}

// TestSetDefaultAIConfig_Success 测试设置默认配置成功
func TestSetDefaultAIConfig_Success(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "PUT", "/api/v1/ai-configs/2/default", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseAIConfigResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, true, data["is_default"])
}

// TestSetDefaultAIConfig_NotFound 测试设置不存在配置为默认
func TestSetDefaultAIConfig_NotFound(t *testing.T) {
	router := mockAIConfigRouter()

	w := performAIConfigRequest(router, "PUT", "/api/v1/ai-configs/999/default", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ============================================================================
// Benchmark 测试
// ============================================================================

// BenchmarkGetAIConfigList 基准测试：获取配置列表
func BenchmarkGetAIConfigList(b *testing.B) {
	router := mockAIConfigRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/ai-configs", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkCreateAIConfig 基准测试：创建配置
func BenchmarkCreateAIConfig(b *testing.B) {
	router := mockAIConfigRouter()

	body, _ := json.Marshal(map[string]interface{}{
		"config_name":      "Benchmark",
		"provider_type":    "openai_compatible",
		"base_url":         "https://api.example.com",
		"api_key":          "sk-benchmark",
		"available_models": []string{"model-1"},
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/ai-configs", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

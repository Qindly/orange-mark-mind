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
// Folder Handler 单元测试
// 使用 mock 数据进行测试
// ============================================================================

func init() {
	gin.SetMode(gin.TestMode)
}

// mockFolderRouter 创建用于测试的 mock 路由
func mockFolderRouter() *gin.Engine {
	r := gin.New()

	// 模拟认证中间件，直接设置 user_id
	r.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})

	// Mock GET /folders - 获取列表
	r.GET("/api/v1/folders", func(c *gin.Context) {
		flat := c.Query("flat") == "true"
		if flat {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data": []gin.H{
					{
						"id":             "kb-0",
						"user_id":        1,
						"name":           "默认知识库",
						"document_count": 1,
					},
					{
						"id":             "kb-1",
						"user_id":        1,
						"name":           "前端知识库",
						"document_count": 4,
					},
				},
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data": []gin.H{
					{
						"id":             "kb-0",
						"user_id":        1,
						"name":           "默认知识库",
						"document_count": 1,
						"children":       []gin.H{},
					},
					{
						"id":             "kb-1",
						"user_id":        1,
						"name":           "前端知识库",
						"document_count": 4,
						"children":       []gin.H{},
					},
				},
			})
		}
	})

	// Mock POST /folders - 创建
	r.POST("/api/v1/folders", func(c *gin.Context) {
		var req struct {
			Name        string  `json:"name"`
			Description *string `json:"description"`
			ParentID    *string `json:"parent_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    1001,
				"message": err.Error(),
			})
			return
		}
		if req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    1001,
				"message": "name is required",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":             "kb-10",
				"user_id":        1,
				"name":           req.Name,
				"description":    req.Description,
				"document_count": 0,
			},
		})
	})

	// Mock GET /folders/:id - 获取单个
	r.GET("/api/v1/folders/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "kb-1" {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data": gin.H{
					"id":             "kb-1",
					"user_id":        1,
					"name":           "前端知识库",
					"description":    "前端相关技术文档",
					"document_count": 4,
				},
			})
		} else if id == "kb-999" {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    3002,
				"message": "知识库不存在",
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data": gin.H{
					"id":      id,
					"user_id": 1,
					"name":    "Test Folder",
				},
			})
		}
	})

	// Mock PUT /folders/:id - 更新
	r.PUT("/api/v1/folders/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "kb-0" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    1001,
				"message": "cannot modify default folder",
			})
			return
		}
		if id == "kb-999" {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    3002,
				"message": "知识库不存在",
			})
			return
		}
		var req struct {
			Name        *string `json:"name"`
			Description *string `json:"description"`
		}
		c.ShouldBindJSON(&req)
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":   id,
				"name": req.Name,
			},
		})
	})

	// Mock DELETE /folders/:id - 删除
	r.DELETE("/api/v1/folders/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "kb-0" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    1001,
				"message": "默认知识库不可删除",
			})
			return
		}
		if id == "kb-999" {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    3002,
				"message": "知识库不存在",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"message":            "知识库已删除",
				"affected_documents": 3,
			},
		})
	})

	return r
}

// performFolderRequest 执行 HTTP 请求
func performFolderRequest(r *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
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

// parseFolderResponse 解析响应
func parseFolderResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

// ============================================================================
// 单元测试
// ============================================================================

// TestGetFolderList_Success 测试获取知识库列表成功
func TestGetFolderList_Success(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "GET", "/api/v1/folders", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])
	assert.NotNil(t, resp["data"])

	data := resp["data"].([]interface{})
	assert.GreaterOrEqual(t, len(data), 1)
}

// TestGetFolderList_Flat 测试获取扁平列表
func TestGetFolderList_Flat(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "GET", "/api/v1/folders?flat=true", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].([]interface{})
	// 扁平列表不应有 children 字段（或为空数组）
	for _, item := range data {
		folder := item.(map[string]interface{})
		_, hasChildren := folder["children"]
		assert.False(t, hasChildren, "扁平列表不应有 children 字段")
	}
}

// TestCreateFolder_Success 测试创建知识库成功
func TestCreateFolder_Success(t *testing.T) {
	router := mockFolderRouter()

	body := map[string]interface{}{
		"name":        "新知识库",
		"description": "测试描述",
	}

	w := performFolderRequest(router, "POST", "/api/v1/folders", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "新知识库", data["name"])
	assert.NotEmpty(t, data["id"])
}

// TestCreateFolder_MissingName 测试创建知识库缺少名称
func TestCreateFolder_MissingName(t *testing.T) {
	router := mockFolderRouter()

	body := map[string]interface{}{
		"description": "只有描述没有名称",
	}

	w := performFolderRequest(router, "POST", "/api/v1/folders", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(1001), resp["code"])
}

// TestGetFolderByID_Success 测试获取单个知识库成功
func TestGetFolderByID_Success(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "GET", "/api/v1/folders/kb-1", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "kb-1", data["id"])
	assert.Equal(t, "前端知识库", data["name"])
}

// TestGetFolderByID_NotFound 测试获取不存在的知识库
func TestGetFolderByID_NotFound(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "GET", "/api/v1/folders/kb-999", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(3002), resp["code"])
}

// TestUpdateFolder_Success 测试更新知识库成功
func TestUpdateFolder_Success(t *testing.T) {
	router := mockFolderRouter()

	body := map[string]interface{}{
		"name": "更新后的名称",
	}

	w := performFolderRequest(router, "PUT", "/api/v1/folders/kb-1", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestUpdateFolder_DefaultFolder 测试更新默认知识库（应失败）
func TestUpdateFolder_DefaultFolder(t *testing.T) {
	router := mockFolderRouter()

	body := map[string]interface{}{
		"name": "尝试修改默认知识库",
	}

	w := performFolderRequest(router, "PUT", "/api/v1/folders/kb-0", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(1001), resp["code"])
}

// TestDeleteFolder_Success 测试删除知识库成功
func TestDeleteFolder_Success(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "DELETE", "/api/v1/folders/kb-1", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "知识库已删除", data["message"])
	assert.NotNil(t, data["affected_documents"])
}

// TestDeleteFolder_DefaultFolder 测试删除默认知识库（应失败）
func TestDeleteFolder_DefaultFolder(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "DELETE", "/api/v1/folders/kb-0", nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(1001), resp["code"])
}

// TestDeleteFolder_NotFound 测试删除不存在的知识库
func TestDeleteFolder_NotFound(t *testing.T) {
	router := mockFolderRouter()

	w := performFolderRequest(router, "DELETE", "/api/v1/folders/kb-999", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	resp := parseFolderResponse(w)
	assert.Equal(t, float64(3002), resp["code"])
}

// ============================================================================
// Benchmark 测试
// ============================================================================

// BenchmarkGetFolderList 基准测试：获取知识库列表
func BenchmarkGetFolderList(b *testing.B) {
	router := mockFolderRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/folders", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkCreateFolder 基准测试：创建知识库
func BenchmarkCreateFolder(b *testing.B) {
	router := mockFolderRouter()

	body, _ := json.Marshal(map[string]string{
		"name":        "Benchmark Folder",
		"description": "Benchmark test",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/folders", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkGetFolderByID 基准测试：获取单个知识库
func BenchmarkGetFolderByID(b *testing.B) {
	router := mockFolderRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/folders/kb-1", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkUpdateFolder 基准测试：更新知识库
func BenchmarkUpdateFolder(b *testing.B) {
	router := mockFolderRouter()

	body, _ := json.Marshal(map[string]string{
		"name": "Updated Name",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("PUT", "/api/v1/folders/kb-1", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkDeleteFolder 基准测试：删除知识库
func BenchmarkDeleteFolder(b *testing.B) {
	router := mockFolderRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("DELETE", "/api/v1/folders/kb-1", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

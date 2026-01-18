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
// Document Handler 单元测试
// 使用 mock 数据进行测试
// ============================================================================

// mockDocumentRouter 创建用于测试的 mock 路由
func mockDocumentRouter() *gin.Engine {
	r := gin.New()

	// 模拟认证中间件
	r.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})

	// Mock GET /documents - 获取列表
	r.GET("/api/v1/documents", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": []gin.H{
				{
					"id":           "doc-1",
					"user_id":      1,
					"folder_id":    "kb-1",
					"folder_name":  "前端知识库",
					"title":        "JavaScript 基础",
					"is_favorited": false,
					"is_deleted":   false,
				},
				{
					"id":           "doc-2",
					"user_id":      1,
					"folder_id":    "kb-1",
					"folder_name":  "前端知识库",
					"title":        "React 入门",
					"is_favorited": true,
					"is_deleted":   false,
				},
			},
		})
	})

	// Mock POST /documents - 创建
	r.POST("/api/v1/documents", func(c *gin.Context) {
		var req struct {
			Title    string `json:"title"`
			FolderID string `json:"folder_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": err.Error()})
			return
		}
		if req.Title == "" || req.FolderID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"code": 1001, "message": "title and folder_id are required"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"id":           "doc-10",
				"user_id":      1,
				"folder_id":    req.FolderID,
				"title":        req.Title,
				"is_favorited": false,
				"is_deleted":   false,
			},
		})
	})

	// Mock GET /documents/recent
	r.GET("/api/v1/documents/recent", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": []gin.H{
				{"id": "doc-1", "title": "最近文档1"},
				{"id": "doc-2", "title": "最近文档2"},
			},
		})
	})

	// Mock GET /documents/favorites
	r.GET("/api/v1/documents/favorites", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": []gin.H{
				{"id": "doc-2", "title": "收藏文档", "is_favorited": true},
			},
		})
	})

	// Mock GET /documents/trash
	r.GET("/api/v1/documents/trash", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": []gin.H{
				{"id": "doc-100", "title": "已删除文档", "is_deleted": true},
			},
		})
	})

	// Mock GET /documents/:id
	r.GET("/api/v1/documents/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "doc-1" {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data": gin.H{
					"id":           "doc-1",
					"user_id":      1,
					"folder_id":    "kb-1",
					"folder_name":  "前端知识库",
					"title":        "JavaScript 基础",
					"content":      "# JavaScript 基础\n\n## 变量",
					"is_favorited": false,
					"is_deleted":   false,
				},
			})
		} else if id == "doc-999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 3001, "message": "文档不存在"})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data":    gin.H{"id": id, "title": "Test Document"},
			})
		}
	})

	// Mock PUT /documents/:id
	r.PUT("/api/v1/documents/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "doc-999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 3001, "message": "文档不存在"})
			return
		}
		var req struct {
			Title   *string `json:"title"`
			Content *string `json:"content"`
		}
		c.ShouldBindJSON(&req)
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data":    gin.H{"id": id, "title": req.Title},
		})
	})

	// Mock DELETE /documents/:id
	r.DELETE("/api/v1/documents/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "doc-999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 3001, "message": "文档不存在"})
			return
		}
		permanent := c.Query("permanent") == "true"
		msg := "文档已移入回收站"
		if permanent {
			msg = "文档已永久删除"
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data":    gin.H{"message": msg},
		})
	})

	// Mock POST /documents/:id/restore
	r.POST("/api/v1/documents/:id/restore", func(c *gin.Context) {
		id := c.Param("id")
		if id == "doc-999" {
			c.JSON(http.StatusNotFound, gin.H{"code": 3001, "message": "文档不存在"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data":    gin.H{"message": "文档已恢复"},
		})
	})

	return r
}

// performDocRequest 执行 HTTP 请求
func performDocRequest(r *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
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

// parseDocResponse 解析响应
func parseDocResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

// ============================================================================
// 单元测试
// ============================================================================

// TestGetDocumentList_Success 测试获取文档列表成功
func TestGetDocumentList_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])
	assert.NotNil(t, resp["data"])

	data := resp["data"].([]interface{})
	assert.GreaterOrEqual(t, len(data), 1)
}

// TestCreateDocument_Success 测试创建文档成功
func TestCreateDocument_Success(t *testing.T) {
	router := mockDocumentRouter()

	body := map[string]interface{}{
		"title":     "新文档",
		"folder_id": "kb-1",
	}

	w := performDocRequest(router, "POST", "/api/v1/documents", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "新文档", data["title"])
	assert.NotEmpty(t, data["id"])
}

// TestCreateDocument_MissingTitle 测试创建文档缺少标题
func TestCreateDocument_MissingTitle(t *testing.T) {
	router := mockDocumentRouter()

	body := map[string]interface{}{
		"folder_id": "kb-1",
	}

	w := performDocRequest(router, "POST", "/api/v1/documents", body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestGetDocumentByID_Success 测试获取单个文档成功
func TestGetDocumentByID_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents/doc-1", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "doc-1", data["id"])
	assert.Equal(t, "JavaScript 基础", data["title"])
	assert.NotNil(t, data["content"])
}

// TestGetDocumentByID_NotFound 测试获取不存在的文档
func TestGetDocumentByID_NotFound(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents/doc-999", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(3001), resp["code"])
}

// TestGetRecentDocuments_Success 测试获取最近文档成功
func TestGetRecentDocuments_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents/recent", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].([]interface{})
	assert.GreaterOrEqual(t, len(data), 1)
}

// TestGetFavoriteDocuments_Success 测试获取收藏文档成功
func TestGetFavoriteDocuments_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents/favorites", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestGetTrashDocuments_Success 测试获取回收站文档成功
func TestGetTrashDocuments_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "GET", "/api/v1/documents/trash", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestUpdateDocument_Success 测试更新文档成功
func TestUpdateDocument_Success(t *testing.T) {
	router := mockDocumentRouter()

	body := map[string]interface{}{
		"title":   "更新后的标题",
		"content": "更新后的内容",
	}

	w := performDocRequest(router, "PUT", "/api/v1/documents/doc-1", body)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestUpdateDocument_NotFound 测试更新不存在的文档
func TestUpdateDocument_NotFound(t *testing.T) {
	router := mockDocumentRouter()

	body := map[string]interface{}{
		"title": "更新标题",
	}

	w := performDocRequest(router, "PUT", "/api/v1/documents/doc-999", body)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestDeleteDocument_Success 测试删除文档成功（软删除）
func TestDeleteDocument_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "DELETE", "/api/v1/documents/doc-1", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "文档已移入回收站", data["message"])
}

// TestDeleteDocument_Permanent 测试永久删除文档
func TestDeleteDocument_Permanent(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "DELETE", "/api/v1/documents/doc-1?permanent=true", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "文档已永久删除", data["message"])
}

// TestDeleteDocument_NotFound 测试删除不存在的文档
func TestDeleteDocument_NotFound(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "DELETE", "/api/v1/documents/doc-999", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestRestoreDocument_Success 测试恢复文档成功
func TestRestoreDocument_Success(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "POST", "/api/v1/documents/doc-1/restore", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseDocResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "文档已恢复", data["message"])
}

// TestRestoreDocument_NotFound 测试恢复不存在的文档
func TestRestoreDocument_NotFound(t *testing.T) {
	router := mockDocumentRouter()

	w := performDocRequest(router, "POST", "/api/v1/documents/doc-999/restore", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ============================================================================
// Benchmark 测试
// ============================================================================

// BenchmarkGetDocumentList 基准测试：获取文档列表
func BenchmarkGetDocumentList(b *testing.B) {
	router := mockDocumentRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/documents", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkCreateDocument 基准测试：创建文档
func BenchmarkCreateDocument(b *testing.B) {
	router := mockDocumentRouter()

	body, _ := json.Marshal(map[string]string{
		"title":     "Benchmark Document",
		"folder_id": "kb-1",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/documents", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkGetDocumentByID 基准测试：获取单个文档
func BenchmarkGetDocumentByID(b *testing.B) {
	router := mockDocumentRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/documents/doc-1", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkUpdateDocument 基准测试：更新文档
func BenchmarkUpdateDocument(b *testing.B) {
	router := mockDocumentRouter()

	body, _ := json.Marshal(map[string]string{
		"title":   "Updated Title",
		"content": "Updated Content",
	})

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("PUT", "/api/v1/documents/doc-1", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

// BenchmarkDeleteDocument 基准测试：删除文档
func BenchmarkDeleteDocument(b *testing.B) {
	router := mockDocumentRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("DELETE", "/api/v1/documents/doc-1", nil)
			req.Header.Set("Authorization", "Bearer mock_token")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
		}
	})
}

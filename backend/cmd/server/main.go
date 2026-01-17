package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// 设置 Gin 模式
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	// 创建 Gin 引擎
	r := gin.Default()

	// 健康检查接口
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// TODO: 注册路由组
	// - /api/v1/auth (认证相关)
	// - /api/v1/users (用户管理)
	// - /api/v1/documents (文档管理)
	// - /api/v1/ai (AI 对话)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "60100"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

package main

import (
	"log"
	"os"

	"github.com/Qindly/orange-mark-mind/internal/config"
	"github.com/Qindly/orange-mark-mind/internal/handler"
	"github.com/Qindly/orange-mark-mind/internal/middleware"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env 文件（本地开发）
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化数据库
	db, err := config.InitDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 初始化 Redis
	redisClient, err := config.InitRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// 设置 Gin 模式
	gin.SetMode(cfg.GinMode)

	// 创建 Gin 引擎
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORSMiddleware())

	// 初始化 Repository
	userRepo := repository.NewUserRepository(db)
	folderRepo := repository.NewFolderRepository(db)
	docRepo := repository.NewDocumentRepository(db)

	// 初始化 Service
	authService := service.NewAuthService(userRepo, redisClient, cfg)
	folderService := service.NewFolderService(folderRepo)
	docService := service.NewDocumentService(docRepo)

	// 初始化 Handler
	authHandler := handler.NewAuthHandler(authService)
	folderHandler := handler.NewFolderHandler(folderService)
	docHandler := handler.NewDocumentHandler(docService)

	// ========================================================================
	// 路由配置
	// ========================================================================

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 认证路由（公开）
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// 需要认证的认证路由
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.POST("/logout-all", authHandler.LogoutAll)
		}

		// 知识库路由（需要认证）
		folders := v1.Group("/folders")
		folders.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService))
		{
			folders.GET("", folderHandler.GetList)
			folders.POST("", folderHandler.Create)
			folders.GET("/:id", folderHandler.GetByID)
			folders.PUT("/:id", folderHandler.Update)
			folders.DELETE("/:id", folderHandler.Delete)
		}

		// 文档路由（需要认证）
		documents := v1.Group("/documents")
		documents.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService))
		{
			documents.GET("", docHandler.GetList)
			documents.POST("", docHandler.Create)
			documents.GET("/recent", docHandler.GetRecent)
			documents.GET("/favorites", docHandler.GetFavorites)
			documents.GET("/trash", docHandler.GetTrash)
			documents.GET("/:id", docHandler.GetByID)
			documents.PUT("/:id", docHandler.Update)
			documents.DELETE("/:id", docHandler.Delete)
			documents.POST("/:id/restore", docHandler.Restore)
		}

		// TODO: AI 对话路由
		// ai := v1.Group("/ai")
		// ai.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService))
		// {
		//     // AI 对话路由
		// }
	}

	// 启动服务器
	port := cfg.Port
	if port == "" {
		port = "60100"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
		os.Exit(1)
	}
}

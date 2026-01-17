package middleware

import (
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/Qindly/orange-mark-mind/pkg/response"
	"github.com/Qindly/orange-mark-mind/pkg/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 认证中间件
func AuthMiddleware(jwtSecret string, authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Header 获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, response.CodeUnauthorized)
			c.Abort()
			return
		}

		// 解析 Bearer Token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(c, response.CodeUnauthorized)
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 检查 Token 是否在黑名单中
		blacklisted, err := authService.IsAccessTokenBlacklisted(tokenString)
		if err != nil {
			response.Error(c, response.CodeInternalError)
			c.Abort()
			return
		}
		if blacklisted {
			response.Error(c, response.CodeUnauthorized)
			c.Abort()
			return
		}

		// 解析 Token
		claims, err := utils.ParseToken(tokenString, jwtSecret)
		if err != nil {
			response.Error(c, response.CodeUnauthorized)
			c.Abort()
			return
		}

		// 验证 Token 类型
		if claims.TokenType != utils.AccessToken {
			response.Error(c, response.CodeUnauthorized)
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// AdminMiddleware 管理员权限中间件
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			response.Error(c, response.CodeForbidden)
			c.Abort()
			return
		}
		c.Next()
	}
}

// CORSMiddleware CORS 跨域中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

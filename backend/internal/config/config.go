package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config 应用配置
type Config struct {
	// 服务配置
	Port    string
	GinMode string

	// 数据库配置
	DatabaseURL string

	// Redis 配置
	RedisURL string

	// JWT 配置
	JWTSecret             string
	JWTAccessTokenExpire  time.Duration
	JWTRefreshTokenExpire time.Duration

	// 加密配置
	EncryptionKey string
}

// GlobalConfig 全局配置实例
var GlobalConfig *Config

// LoadConfig 从环境变量加载配置
func LoadConfig() (*Config, error) {
	// 获取 JWT 过期时间（秒）
	accessExpire := getEnvAsInt("JWT_ACCESS_TOKEN_EXPIRE", 900)       // 默认 15 分钟
	refreshExpire := getEnvAsInt("JWT_REFRESH_TOKEN_EXPIRE", 604800)  // 默认 7 天

	config := &Config{
		Port:    getEnv("PORT", "60100"),
		GinMode: getEnv("GIN_MODE", "debug"),

		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", ""),

		JWTSecret:             getEnv("JWT_SECRET", ""),
		JWTAccessTokenExpire:  time.Duration(accessExpire) * time.Second,
		JWTRefreshTokenExpire: time.Duration(refreshExpire) * time.Second,

		EncryptionKey: getEnv("ENCRYPTION_KEY", ""),
	}

	// 验证必要配置
	if err := config.validate(); err != nil {
		return nil, err
	}

	GlobalConfig = config
	return config, nil
}

// validate 验证配置
func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.RedisURL == "" {
		return fmt.Errorf("REDIS_URL is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.EncryptionKey == "" {
		return fmt.Errorf("ENCRYPTION_KEY is required")
	}
	return nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt 获取环境变量并转换为整数
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

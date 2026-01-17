package config

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

// RedisClient 全局 Redis 客户端
var RedisClient *redis.Client

// InitRedis 初始化 Redis 连接
func InitRedis(redisURL string) (*redis.Client, error) {
	// 解析 Redis URL
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	// 创建客户端
	client := redis.NewClient(opt)

	// 测试连接
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	RedisClient = client
	log.Println("Redis connected successfully")
	return client, nil
}

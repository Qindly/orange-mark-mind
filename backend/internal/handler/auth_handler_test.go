package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/Qindly/orange-mark-mind/internal/config"
	"github.com/Qindly/orange-mark-mind/internal/middleware"
	"github.com/Qindly/orange-mark-mind/internal/repository"
	"github.com/Qindly/orange-mark-mind/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

var (
	testRouter      *gin.Engine
	testAuthHandler *AuthHandler
	testAuthService *service.AuthService
	testConfig      *config.Config
)

// TestMain 测试初始化
func TestMain(m *testing.M) {
	// 设置测试环境变量
	os.Setenv("PORT", "60100")
	os.Setenv("GIN_MODE", "test")
	os.Setenv("DATABASE_URL", os.Getenv("TEST_DATABASE_URL"))
	os.Setenv("REDIS_URL", os.Getenv("TEST_REDIS_URL"))
	os.Setenv("JWT_SECRET", "test_jwt_secret_key_for_testing")
	os.Setenv("JWT_ACCESS_TOKEN_EXPIRE", "900")
	os.Setenv("JWT_REFRESH_TOKEN_EXPIRE", "604800")
	os.Setenv("ENCRYPTION_KEY", "test_encryption_key_32bytes!!")

	// 检查是否设置了测试数据库
	if os.Getenv("TEST_DATABASE_URL") == "" || os.Getenv("TEST_REDIS_URL") == "" {
		// 如果没有设置测试数据库，使用 mock 模式
		gin.SetMode(gin.TestMode)
		os.Exit(0)
	}

	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		panic("Failed to load config: " + err.Error())
	}
	testConfig = cfg

	// 初始化数据库
	db, err := config.InitDatabase(cfg.DatabaseURL)
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	// 初始化 Redis
	redisClient, err := config.InitRedis(cfg.RedisURL)
	if err != nil {
		panic("Failed to connect to Redis: " + err.Error())
	}

	// 设置 Gin 测试模式
	gin.SetMode(gin.TestMode)

	// 初始化组件
	userRepo := repository.NewUserRepository(db)
	testAuthService = service.NewAuthService(userRepo, redisClient, cfg)
	testAuthHandler = NewAuthHandler(testAuthService)

	// 创建测试路由
	testRouter = gin.New()
	setupTestRoutes(testRouter, testAuthHandler, testAuthService, cfg)

	// 运行测试
	code := m.Run()
	os.Exit(code)
}

// setupTestRoutes 设置测试路由
func setupTestRoutes(r *gin.Engine, authHandler *AuthHandler, authService *service.AuthService, cfg *config.Config) {
	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware(cfg.JWTSecret, authService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.POST("/logout-all", authHandler.LogoutAll)
		}
	}
}

// ============================================================================
// 辅助函数
// ============================================================================

// performRequest 执行 HTTP 请求
func performRequest(r *gin.Engine, method, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}

	req, _ := http.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

// parseResponse 解析响应
func parseResponse(w *httptest.ResponseRecorder) map[string]interface{} {
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response
}

// ============================================================================
// 单元测试
// ============================================================================

// TestRegister_Success 测试注册成功
func TestRegister_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	body := map[string]string{
		"username": "testuser_" + randomString(8),
		"email":    "test_" + randomString(8) + "@example.com",
		"password": "password123",
		"nickname": "Test User",
	}

	w := performRequest(testRouter, "POST", "/api/v1/auth/register", body, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
	assert.NotNil(t, resp["data"])
}

// TestRegister_DuplicateUsername 测试重复用户名注册
func TestRegister_DuplicateUsername(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	username := "duplicate_" + randomString(8)
	body := map[string]string{
		"username": username,
		"email":    "first_" + randomString(8) + "@example.com",
		"password": "password123",
	}

	// 第一次注册
	performRequest(testRouter, "POST", "/api/v1/auth/register", body, nil)

	// 第二次注册相同用户名
	body["email"] = "second_" + randomString(8) + "@example.com"
	w := performRequest(testRouter, "POST", "/api/v1/auth/register", body, nil)

	assert.Equal(t, http.StatusConflict, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(2001), resp["code"])
}

// TestRegister_InvalidParams 测试无效参数注册
func TestRegister_InvalidParams(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 缺少必填字段
	body := map[string]string{
		"username": "test",
	}

	w := performRequest(testRouter, "POST", "/api/v1/auth/register", body, nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(1001), resp["code"])
}

// TestLogin_Success 测试登录成功
func TestLogin_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 先注册用户
	username := "logintest_" + randomString(8)
	password := "password123"

	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)

	// 登录
	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.NotNil(t, data["user"])
	assert.NotNil(t, data["tokens"])

	tokens := data["tokens"].(map[string]interface{})
	assert.NotEmpty(t, tokens["access_token"])
	assert.NotEmpty(t, tokens["refresh_token"])
}

// TestLogin_InvalidCredentials 测试错误密码登录
func TestLogin_InvalidCredentials(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	loginBody := map[string]string{
		"username": "nonexistent_user",
		"password": "wrongpassword",
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(2002), resp["code"])
}

// TestRefresh_Success 测试 Token 刷新成功
func TestRefresh_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 先注册并登录
	username := "refreshtest_" + randomString(8)
	password := "password123"

	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)

	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	loginResp := performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)
	loginData := parseResponse(loginResp)
	tokens := loginData["data"].(map[string]interface{})["tokens"].(map[string]interface{})
	refreshToken := tokens["refresh_token"].(string)

	// 刷新 Token
	refreshBody := map[string]string{
		"refresh_token": refreshToken,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/refresh", refreshBody, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.NotEmpty(t, data["access_token"])
	assert.NotEmpty(t, data["refresh_token"])
}

// TestRefresh_InvalidToken 测试无效 Token 刷新
func TestRefresh_InvalidToken(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	refreshBody := map[string]string{
		"refresh_token": "invalid_token",
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/refresh", refreshBody, nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(2004), resp["code"])
}

// TestLogout_Success 测试登出成功
func TestLogout_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 先注册并登录
	username := "logouttest_" + randomString(8)
	password := "password123"

	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)

	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	loginResp := performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)
	loginData := parseResponse(loginResp)
	tokens := loginData["data"].(map[string]interface{})["tokens"].(map[string]interface{})
	accessToken := tokens["access_token"].(string)
	refreshToken := tokens["refresh_token"].(string)

	// 登出
	logoutBody := map[string]string{
		"refresh_token": refreshToken,
	}
	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/logout", logoutBody, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestLogout_Unauthorized 测试未授权登出
func TestLogout_Unauthorized(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	w := performRequest(testRouter, "POST", "/api/v1/auth/logout", nil, nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestLogoutAll_Success 测试登出所有设备成功
func TestLogoutAll_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 先注册并登录
	username := "logoutalltest_" + randomString(8)
	password := "password123"

	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)

	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	loginResp := performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)
	loginData := parseResponse(loginResp)
	tokens := loginData["data"].(map[string]interface{})["tokens"].(map[string]interface{})
	accessToken := tokens["access_token"].(string)

	// 登出所有设备
	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/logout-all", nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// ============================================================================
// 辅助函数
// ============================================================================

// randomString 生成随机字符串
func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[i%len(letters)]
	}
	return string(b)
}

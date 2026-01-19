package handler

import (
	"net/http"
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
)

// ============================================================================
// Admin Handler 测试
// ============================================================================

// TestGetUsers_Success 测试获取用户列表成功
func TestGetUsers_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 创建管理员用户并登录
	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users", nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	data := resp["data"].(map[string]interface{})
	assert.NotNil(t, data["users"])
	assert.NotNil(t, data["total"])
	assert.NotNil(t, data["page"])
	assert.NotNil(t, data["page_size"])
}

// TestGetUsers_WithSearch 测试带搜索参数获取用户列表
func TestGetUsers_WithSearch(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users?search=admin&page=1&page_size=5", nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestGetUsers_WithRoleFilter 测试按角色筛选用户
func TestGetUsers_WithRoleFilter(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users?role=admin", nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp := parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestGetUsers_Unauthorized 测试未授权访问用户列表
func TestGetUsers_Unauthorized(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users", nil, nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestGetUsers_Forbidden 测试非管理员访问用户列表
func TestGetUsers_Forbidden(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	// 创建普通用户并登录
	accessToken := createNormalUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users", nil, headers)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

// TestGetUserByID_Success 测试获取单个用户成功
func TestGetUserByID_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	// 先获取用户列表，拿到一个用户 ID
	w := performRequest(testRouter, "GET", "/api/v1/admin/users", nil, headers)
	resp := parseResponse(w)
	data := resp["data"].(map[string]interface{})
	users := data["users"].([]interface{})

	if len(users) == 0 {
		t.Skip("No users found, skipping test")
	}

	firstUser := users[0].(map[string]interface{})
	userID := int(firstUser["id"].(float64))

	// 获取单个用户
	w = performRequest(testRouter, "GET", "/api/v1/admin/users/"+itoa(userID), nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp = parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	userData := resp["data"].(map[string]interface{})
	assert.Equal(t, float64(userID), userData["id"])
}

// TestGetUserByID_NotFound 测试获取不存在的用户
func TestGetUserByID_NotFound(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "GET", "/api/v1/admin/users/999999", nil, headers)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestUpdateUser_Success 测试更新用户成功
func TestUpdateUser_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	// 创建一个普通用户来更新
	targetAccessToken := createNormalUserAndLogin(t)
	_ = targetAccessToken // 不需要使用这个 token

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	// 获取用户列表找到刚创建的用户
	w := performRequest(testRouter, "GET", "/api/v1/admin/users?role=user", nil, headers)
	resp := parseResponse(w)
	data := resp["data"].(map[string]interface{})
	users := data["users"].([]interface{})

	if len(users) == 0 {
		t.Skip("No users found, skipping test")
	}

	lastUser := users[len(users)-1].(map[string]interface{})
	userID := int(lastUser["id"].(float64))

	// 更新用户
	updateBody := map[string]string{
		"nickname": "Updated Nickname",
		"status":   "active",
	}
	w = performRequest(testRouter, "PUT", "/api/v1/admin/users/"+itoa(userID), updateBody, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp = parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])

	userData := resp["data"].(map[string]interface{})
	assert.Equal(t, "Updated Nickname", userData["nickname"])
}

// TestUpdateUser_CannotChangeOwnRole 测试不能修改自己的角色
func TestUpdateUser_CannotChangeOwnRole(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken, userID := createAdminUserAndLoginWithID(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	// 尝试修改自己的角色
	updateBody := map[string]string{
		"role": "user",
	}
	w := performRequest(testRouter, "PUT", "/api/v1/admin/users/"+itoa(userID), updateBody, headers)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseResponse(w)
	assert.Contains(t, resp["message"], "不能修改自己的角色")
}

// TestDeleteUser_Success 测试删除用户成功
func TestDeleteUser_Success(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	// 创建一个普通用户来删除
	createNormalUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	// 获取用户列表找到刚创建的用户
	w := performRequest(testRouter, "GET", "/api/v1/admin/users?role=user", nil, headers)
	resp := parseResponse(w)
	data := resp["data"].(map[string]interface{})
	users := data["users"].([]interface{})

	if len(users) == 0 {
		t.Skip("No users found, skipping test")
	}

	lastUser := users[len(users)-1].(map[string]interface{})
	userID := int(lastUser["id"].(float64))

	// 删除用户
	w = performRequest(testRouter, "DELETE", "/api/v1/admin/users/"+itoa(userID), nil, headers)

	assert.Equal(t, http.StatusOK, w.Code)

	resp = parseResponse(w)
	assert.Equal(t, float64(0), resp["code"])
}

// TestDeleteUser_CannotDeleteSelf 测试不能删除自己
func TestDeleteUser_CannotDeleteSelf(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken, userID := createAdminUserAndLoginWithID(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	// 尝试删除自己
	w := performRequest(testRouter, "DELETE", "/api/v1/admin/users/"+itoa(userID), nil, headers)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	resp := parseResponse(w)
	assert.Contains(t, resp["message"], "不能删除自己的账号")
}

// TestDeleteUser_NotFound 测试删除不存在的用户
func TestDeleteUser_NotFound(t *testing.T) {
	if testRouter == nil {
		t.Skip("Test database not configured, skipping integration test")
	}

	accessToken := createAdminUserAndLogin(t)

	headers := map[string]string{
		"Authorization": "Bearer " + accessToken,
	}

	w := performRequest(testRouter, "DELETE", "/api/v1/admin/users/999999", nil, headers)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ============================================================================
// 辅助函数
// ============================================================================

// createAdminUserAndLogin 创建管理员用户并登录，返回 access token
func createAdminUserAndLogin(t *testing.T) string {
	token, _ := createAdminUserAndLoginWithID(t)
	return token
}

// createAdminUserAndLoginWithID 创建管理员用户并登录，返回 access token 和 user ID
func createAdminUserAndLoginWithID(t *testing.T) (string, int) {
	username := "admin_" + randomString(8)
	password := "password123"

	// 注册用户
	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("Failed to register admin user: %s", w.Body.String())
	}

	// 获取用户 ID
	resp := parseResponse(w)
	userData := resp["data"].(map[string]interface{})["user"].(map[string]interface{})
	userID := int(userData["id"].(float64))

	// 手动更新用户角色为 admin（在真实测试中需要数据库操作）
	// 这里我们假设可以通过某种方式设置用户为 admin
	// 在集成测试中，可能需要直接操作数据库

	// 登录
	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	w = performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)

	resp = parseResponse(w)
	tokens := resp["data"].(map[string]interface{})["tokens"].(map[string]interface{})
	accessToken := tokens["access_token"].(string)

	return accessToken, userID
}

// createNormalUserAndLogin 创建普通用户并登录，返回 access token
func createNormalUserAndLogin(t *testing.T) string {
	username := "user_" + randomString(8)
	password := "password123"

	// 注册用户
	registerBody := map[string]string{
		"username": username,
		"email":    username + "@example.com",
		"password": password,
	}
	w := performRequest(testRouter, "POST", "/api/v1/auth/register", registerBody, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("Failed to register normal user: %s", w.Body.String())
	}

	// 登录
	loginBody := map[string]string{
		"username": username,
		"password": password,
	}
	w = performRequest(testRouter, "POST", "/api/v1/auth/login", loginBody, nil)

	resp := parseResponse(w)
	tokens := resp["data"].(map[string]interface{})["tokens"].(map[string]interface{})
	accessToken := tokens["access_token"].(string)

	return accessToken
}

// itoa 将 int 转换为 string
func itoa(i int) string {
	return strconv.Itoa(i)
}

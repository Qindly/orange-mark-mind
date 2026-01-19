package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// 业务错误码
const (
	CodeSuccess = 0

	// 通用错误 1xxx
	CodeParamError   = 1001
	CodeUnauthorized = 1002
	CodeForbidden    = 1003
	CodeNotFound     = 1004
	CodeBadRequest   = 1005

	// 用户相关 2xxx
	CodeUserExists          = 2001
	CodeInvalidCredentials  = 2002
	CodeUserDisabled        = 2003
	CodeInvalidRefreshToken = 2004

	// 文档相关 3xxx
	CodeDocumentNotFound = 3001
	CodeFolderNotFound   = 3002

	// AI 相关 4xxx
	CodeAIConfigNotFound = 4001
	CodeAIAPIError       = 4002

	// 服务器错误 5xxx
	CodeInternalError = 5000
)

// 错误消息映射
var codeMessages = map[int]string{
	CodeSuccess:             "success",
	CodeParamError:          "参数错误",
	CodeUnauthorized:        "未授权",
	CodeForbidden:           "禁止访问",
	CodeNotFound:            "资源不存在",
	CodeUserExists:          "用户已存在",
	CodeInvalidCredentials:  "用户名或密码错误",
	CodeUserDisabled:        "账号已被禁用",
	CodeInvalidRefreshToken: "Refresh Token 无效",
	CodeDocumentNotFound:    "文档不存在",
	CodeFolderNotFound:      "文件夹不存在",
	CodeAIConfigNotFound:    "AI 配置不存在",
	CodeAIAPIError:          "AI API 调用失败",
	CodeInternalError:       "服务器内部错误",
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: "success",
		Data:    data,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int) {
	message := codeMessages[code]
	if message == "" {
		message = "未知错误"
	}

	httpStatus := getHTTPStatus(code)
	c.JSON(httpStatus, Response{
		Code:    code,
		Message: message,
	})
}

// ErrorWithMessage 带自定义消息的错误响应
func ErrorWithMessage(c *gin.Context, code int, message string) {
	httpStatus := getHTTPStatus(code)
	c.JSON(httpStatus, Response{
		Code:    code,
		Message: message,
	})
}

// getHTTPStatus 根据业务错误码获取 HTTP 状态码
func getHTTPStatus(code int) int {
	switch code {
	case CodeSuccess:
		return http.StatusOK
	case CodeParamError, CodeBadRequest:
		return http.StatusBadRequest
	case CodeUnauthorized, CodeInvalidCredentials, CodeInvalidRefreshToken:
		return http.StatusUnauthorized
	case CodeForbidden, CodeUserDisabled:
		return http.StatusForbidden
	case CodeNotFound, CodeDocumentNotFound, CodeFolderNotFound, CodeAIConfigNotFound:
		return http.StatusNotFound
	case CodeUserExists:
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}

// ErrorWithMsg 带自定义消息的错误响应（ErrorWithMessage 的别名）
func ErrorWithMsg(c *gin.Context, code int, message string) {
	ErrorWithMessage(c, code, message)
}

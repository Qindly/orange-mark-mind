package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/Qindly/orange-mark-mind/internal/model"
	"github.com/Qindly/orange-mark-mind/pkg/utils"
)

// AIClient AI 客户端接口
type AIClient struct {
	httpClient *http.Client
}

// NewAIClient 创建 AI 客户端
func NewAIClient() *AIClient {
	return &AIClient{
		httpClient: &http.Client{},
	}
}

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// StreamChunk 流式响应块
type StreamChunk struct {
	Content string `json:"content"`
	Done    bool   `json:"done"`
	Error   string `json:"error,omitempty"`
}

// StreamCallback 流式回调函数
type StreamCallback func(chunk StreamChunk) error

// StreamChat 流式聊天
func (c *AIClient) StreamChat(
	ctx context.Context,
	config *model.AIConfig,
	messages []ChatMessage,
	modelName string,
	encryptionKey string,
	callback StreamCallback,
) (string, error) {
	// 解密 API Key
	apiKey, err := utils.DecryptAESGCM(config.APIKeyEncrypted, encryptionKey)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt API key: %w", err)
	}

	switch config.ProviderType {
	case model.ProviderOpenAICompatible:
		return c.streamOpenAI(ctx, config.BaseURL, apiKey, messages, modelName, callback)
	case model.ProviderGemini:
		return c.streamGemini(ctx, config.BaseURL, apiKey, messages, modelName, callback)
	default:
		// Default to OpenAI compatible
		return c.streamOpenAI(ctx, config.BaseURL, apiKey, messages, modelName, callback)
	}
}

// OpenAI Chat Completion Request/Response
type openAIChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type openAIStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

func (c *AIClient) streamOpenAI(
	ctx context.Context,
	baseURL, apiKey string,
	messages []ChatMessage,
	modelName string,
	callback StreamCallback,
) (string, error) {
	// Build request
	reqBody := openAIChatRequest{
		Model:    modelName,
		Messages: messages,
		Stream:   true,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := strings.TrimSuffix(baseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error: %s - %s", resp.Status, string(body))
	}

	// Parse SSE stream
	reader := bufio.NewReader(resp.Body)
	var fullContent strings.Builder

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return fullContent.String(), err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			callback(StreamChunk{Done: true})
			break
		}

		var streamResp openAIStreamResponse
		if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
			continue
		}

		if len(streamResp.Choices) > 0 {
			content := streamResp.Choices[0].Delta.Content
			if content != "" {
				fullContent.WriteString(content)
				if err := callback(StreamChunk{Content: content}); err != nil {
					return fullContent.String(), err
				}
			}

			if streamResp.Choices[0].FinishReason == "stop" {
				callback(StreamChunk{Done: true})
				break
			}
		}
	}

	return fullContent.String(), nil
}

// Gemini request/response structures
type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig geminiGenerationConfig `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	MaxOutputTokens int `json:"maxOutputTokens,omitempty"`
}

type geminiStreamResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
}

func (c *AIClient) streamGemini(
	ctx context.Context,
	baseURL, apiKey string,
	messages []ChatMessage,
	modelName string,
	callback StreamCallback,
) (string, error) {
	// Convert messages to Gemini format
	var contents []geminiContent
	for _, msg := range messages {
		role := msg.Role
		if role == "assistant" {
			role = "model"
		}
		contents = append(contents, geminiContent{
			Role:  role,
			Parts: []geminiPart{{Text: msg.Content}},
		})
	}

	reqBody := geminiRequest{
		Contents: contents,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	// Gemini streaming endpoint
	url := fmt.Sprintf("%s/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s",
		strings.TrimSuffix(baseURL, "/"), modelName, apiKey)

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error: %s - %s", resp.Status, string(body))
	}

	// Parse SSE stream
	reader := bufio.NewReader(resp.Body)
	var fullContent strings.Builder

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return fullContent.String(), err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		var streamResp geminiStreamResponse
		if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
			continue
		}

		if len(streamResp.Candidates) > 0 {
			candidate := streamResp.Candidates[0]
			if len(candidate.Content.Parts) > 0 {
				content := candidate.Content.Parts[0].Text
				if content != "" {
					fullContent.WriteString(content)
					if err := callback(StreamChunk{Content: content}); err != nil {
						return fullContent.String(), err
					}
				}
			}

			if candidate.FinishReason == "STOP" {
				callback(StreamChunk{Done: true})
				break
			}
		}
	}

	return fullContent.String(), nil
}

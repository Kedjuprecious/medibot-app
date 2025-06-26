package gemini

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Constants for AI configuration
const (
	SystemInstruction = `You are a cardiologist AI expert. Your role is to:
- Ask 2 follow-up questions to understand user symptoms related to cardiovascular disease, one at a time, based on previous answers.
- Based on answers, recommend first-line medical care (lifestyle advice, a natural thing they can do or take).
- After the questions, respond in two distinct steps: first, give recommendations (medication/lifestyle/tests). If symptoms suggest emergency (like crushing chest pain, syncope, severe shortness of breath), advise urgent cardiologist consultation.
- Then, on a separate call, generate a final summary with: Summary: <summary text>.
Please be clear and structured, act like a compassionate, experienced cardiologist.`
	Temperature       = 0.7
	MaxOutputTokens   = 800
	TopP              = 0.8
	TopK              = 10
	// Safety settings
	HarmCategoryDangerousContent = "HARM_CATEGORY_DANGEROUS_CONTENT"
	BlockOnlyHigh                = "BLOCK_ONLY_HIGH"
)

type GeminiClient struct {
	BaseUrl string
	ApiKey  string
	DefaultModel string
	Client *http.Client
}

// NewGeminiClient creates a new GeminiClient with the provided base URL, API key, and default model.
// It initializes the HTTP client used for making requests.
func NewGeminiClient(baseUrl, apiKey, defaultModel string) *GeminiClient {
	return &GeminiClient{
		BaseUrl:      baseUrl,
		ApiKey:       apiKey,
		DefaultModel: defaultModel,
		Client:       &http.Client{},
	}
}

type Part struct {
	Text string `json:"text"`
}

type Content struct {
	Role string `json:"role"`
	Parts []Part `json:"parts"`
}

// GenerationConfig holds parameters for AI response generation.
type GenerationConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
	TopP            float64 `json:"topP"`
	TopK            int     `json:"topK"`
}

// SafetySetting defines safety thresholds for AI content generation.
type SafetySetting struct {
	Category  string `json:"category"`
	Threshold string `json:"threshold"`
}

// AIPayload is the top-level structure for the request to the AI model.
type AIPayload struct {
	Contents         []Content        `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig"`
	SafetySettings   []SafetySetting  `json:"safetySettings"`
}

// GeminiAPIResponse represents the expected structure of the Gemini API's JSON response.
type GeminiAPIResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	// You might want to add other fields like 'promptFeedback', 'usageMetadata' etc. if needed
}

//request to prommp the ai
func (c *GeminiClient) RequestResponse(contents []Content) (string, error) {
	//constrcut the full ai payload
	payload := AIPayload{
		Contents: contents,
		GenerationConfig: GenerationConfig{
			Temperature:     Temperature,
			MaxOutputTokens: MaxOutputTokens,
			TopP:            TopP,
			TopK:            TopK,
		},
		SafetySettings: []SafetySetting{
			{Category: HarmCategoryDangerousContent, Threshold: BlockOnlyHigh},
		},
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal AI payload: %w", err)
	}

	req, err := http.NewRequest("POST",c.BaseUrl+"/"+c.DefaultModel+":generateContent?key="+c.ApiKey,bytes.NewBuffer(reqBody))
	// You should implement the rest of the function to return a string and error as appropriate
	if err != nil {
		return "", fmt.Errorf("failed to create AI request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.Client.Do(req)
	if err != nil {
		return "", fmt.Errorf("AI API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("AI API returned non-OK status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var geminiResponse GeminiAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResponse); err != nil {
		return "", fmt.Errorf("failed to decode Gemini API response: %w", err)
	}

	if len(geminiResponse.Candidates) > 0 && len(geminiResponse.Candidates[0].Content.Parts) > 0 {
		return geminiResponse.Candidates[0].Content.Parts[0].Text, nil
	}

	return "AI did not provide a valid response.", nil // Default response if no candidates/parts

}
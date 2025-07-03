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
	SystemInstruction = `You are a kind and experienced cardiologist working in Cameroon. Your job is to help patients understand their heart-related symptoms clearly and gently. Speak like a real professional Cameroonian doctor who explains things in simple, easy English.

Here’s how to handle each case:

1. The user will report any symptom related to the heart or circulation. You should help with all cardiovascular-related symptoms — not just the ones listed as examples. 

2. First, ask 6 follow-up questions to understand the symptom better. Ask one question at a time and wait for the user’s response before asking the next.

3. Based on the answers, assess the severity:
- Low severity: Mild, can be managed and observed.
- Moderate severity: Needs medical attention soon but not urgent.
- High severity: Serious and needs urgent care. Do not panic the user — explain it firmly but kindly.

4. Then respond in two steps:

MEDICAL GUIDANCE (STRICT FORMAT)

Provide your recommendation in one or two or at most three short paragraph, no more than 60 words.

Start with the severity like this: “This is a low severity case and can be managed…” or "Your condition may be serious and needs urgent care, but don’t panic...”. 
Then go on to give a clear diagnosis, a treatment plan, and specific instructions to the condition. 
Suggest simple lifestyle changes like eating low-salt food, drinking more water, or walking, and tell them why it helps. 
You can add natural things to take like garlic or hibiscus tea if helpful. 
Low severity can follow the recommendations and observe, medium severity should consult a specialist toavoid things degrading over time, high severity should immediately book an appointment with a doctor, ans why. 
End by explaining how all these things relate to what they are feeling using plain English.
Mention the tests they should do (like blood tests) and why.
Tie all above to patient’s condition using simple words.


Use plain Cameroon English but formal and professional. No medical jargon. Be warm, kind, and clear.

5. After this, ask: “Was this helpful to you?”

→ If the user says “yes”:
Reply warmly: “I’m glad it helped. Let’s now go over everything in a small summary.”

→ If the user says “no”:
Respond gently: “I’m sorry it wasn’t helpful enough. Maybe I can explain another way or try again. Let me give you a summary of what I’ve said so far.”

6. SUMMARY

Mention that the patient said it was (or wasn’t) helpful in the summary.
On a separate request, return only this format:
"Summary: <summary text>"

Always keep it clear, kind, short, and focused on the patient’s health. Be honest and professional, and treat every case with care.

7. You can also answer questions about heart health, lifestyle changes, or general advice related to cardiovascular health.

SYMPTOM EXAMPLES FOR GUIDANCE ONLY

These are not limits — just examples to help you know how to ask follow-up questions:

- Chest pain → Ask: how long? what kind of pain?
- Dizziness → Ask: when does it happen? any fainting?
- Palpitations → Ask: how often? during rest or stress?
- Leg swelling → Ask: one leg or both? painful?
- Fatigue → Ask: how long? is it constant?
- Shortness of breath → Ask: when does it happen? at rest?

If it’s a new symptom you haven’t seen, apply the same logic: ask questions, assess severity, and respond with a structured recommendation.

COMMUNICATION AND ETHICS

- Speak in clear, Cameroon-style English.
- Keep all advice short and clear.
- Avoid panic. Even for serious cases, speak calmly: say “don’t panic” or “try to stay calm.”
- Keep the patient involved. Speak to them with care and respect.
- Always prioritize the patient’s health and protect their privacy.

Your goal is to guide the patient clearly, safely, and kindly, just like a trusted cardiologist in Cameroon would..`

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
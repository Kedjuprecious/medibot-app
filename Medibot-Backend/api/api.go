package api

import (

	// "strconv"
	// "strings"

	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx"
	"medibot.go/db/repo"
	"medibot.go/gemini"
)

type MedibotHandler struct {
	querier repo.Querier
	geminiClient gemini.GeminiClient
}

func NewMedibotHandler(querier repo.Querier, geminiClient gemini.GeminiClient) *MedibotHandler {
	return &MedibotHandler{
		querier:    querier,
		geminiClient: geminiClient,
	}
}

// Register the endpoints
func (h *MedibotHandler) WireHttpHandler() http.Handler {
	r := gin.Default()
	r.Use(gin.CustomRecovery(func(c *gin.Context, _ any) {
		c.String(http.StatusInternalServerError, "Internal Server Error: panic")
		c.AbortWithStatus(http.StatusInternalServerError)
	}))

	r.POST("/user", h.handleCreateUser)
	r.GET("/user/", h.handleGetUserByEmail)
	r.POST("/chat", h.handleConversation)
	r.GET("/chat/messages", h.handleGetConMessages)
	r.GET("/conversations", h.handleUserConvAndMessages)
	
	return r
}

// create new user
func (h *MedibotHandler) handleCreateUser(c *gin.Context) {
	var req repo.CreateUserParams;
	err := c.ShouldBindBodyWithJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err = h.querier.CreateUser(c,req);err!=nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK,gin.H{
		"success": true,
		"message": "user created successfully",
	})
}

//get user by email
func (h *MedibotHandler) handleGetUserByEmail(c *gin.Context){
	email := c.Query("email") // Use c.Query() to get query parameters
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email query parameter is required"})
		return
	}

	user, err := h.querier.GetUserByEmail(c, email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

type createConversationParams struct {
	UserID string `json:"userId"`
	Content string `json:"content"`
	Sender string `json:"sender"`
	ConId string `json:"conId"` // Optional, if provided, will update the conversation
}
//handle conversation
func (h *MedibotHandler) handleConversation(c *gin.Context) {
	var req createConversationParams

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse user ID
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var conID uuid.UUID

	if req.ConId != "" {
		// Parse conversation ID
		conID, err = uuid.Parse(req.ConId)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID"})
			return
		}

		// Check if conversation exists
		_, err := h.querier.GetConversation(c.Request.Context(), repo.GetConversationParams{
			ID:     conID,
			UserID: userID,
		})

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				// Conversation not found → create a new one
				conID, err = h.querier.CreateConversation(c, userID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"details": err.Error()})
				return
			}
		}
	} else {
		// No conId provided → create a new conversation
		conID, err = h.querier.CreateConversation(c, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
			return
		}
	}

	// Create message
	if err := h.querier.CreateMessage(c, repo.CreateMessageParams{
		ConID:   conID,
		Sender:  req.Sender,
		Content: req.Content,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	//get the messages in that conv
	messages,err := h.querier.GetConMessages(c,conID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get conversation messages"})
		return
	}

	// construct the ai gemini payload content
	var aiContents []gemini.Content

	//add the system instruction as the first user role content
	aiContents = append(aiContents, gemini.Content{
		Role: "user",
		Parts: []gemini.Part{
			{Text: gemini.SystemInstruction},
		},
	})

	// map db messages to ai content format
	for _,msg := range messages {
		aiRole := "user"
		if msg.Sender == "assistant"{
			aiRole = "model"
		}


		aiContents = append(aiContents, gemini.Content{
            Role:  aiRole,
            Parts: []gemini.Part{{Text: msg.Content}},
        })
	}


	//prompt the ai
	aiResponseText,err := h.geminiClient.RequestResponse(aiContents)
	if err != nil {
        log.Printf("ERROR: Gemini AI request failed: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service error: " + err.Error()})
        return
    }

	    // Save AI's response to the database
    if err := h.querier.CreateMessage(c.Request.Context(), repo.CreateMessageParams{
        ConID:   conID,
        Sender:  "assistant", // This must match your DB CHECK constraint
        Content: aiResponseText,
    }); err != nil {
        log.Printf("ERROR: Failed to create AI response message: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save AI response"})
        return
    }

	// Respond to frontend
    responsePayload := gin.H{
        "conversationId": conID.String(),
        "aiResponse":     aiResponseText, // Send the actual AI response text
        "message":        "Message processed successfully",
    }

	 c.JSON(http.StatusOK, responsePayload)
}

//get all the messages in a conversation
func (h *MedibotHandler) handleGetConMessages(c *gin.Context) {
	conIDStr := c.Query("conId")
	if conIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "conId query parameter is required"})
		return
	}

		conID, err := uuid.Parse(conIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID"})
			return
		}

	messages, err := h.querier.GetConMessages(c, conID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get conversation messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

//get all users conversations and messages
func (h *MedibotHandler) handleUserConvAndMessages(c *gin.Context){
	userId := c.Query("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "conId query parameter is required"})
		return
	}

	userID, err := uuid.Parse(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID"})
		return
	}
	
	conv, err := h.querier.ListFullConversationsByUserID(c,userID)
	if err !=nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userid query parameter is required"})
		return
	}

	c.JSON(http.StatusOK, conv)
}



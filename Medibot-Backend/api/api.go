package api

import (

	// "strconv"
	// "strings"

	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx"
	"medibot.go/db/repo"
)

type MedibotHandler struct {
	querier repo.Querier
}

func NewMedibotHandler(querier repo.Querier) *MedibotHandler {
	return &MedibotHandler{
		querier: querier,
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

	c.JSON(http.StatusOK, gin.H{
		"conversationId": conID,
		"message":        "Message stored successfully",
	})
}



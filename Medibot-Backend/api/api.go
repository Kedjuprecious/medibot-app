package api

import (

	// "strconv"
	// "strings"

	"errors"
	"log"
	"net/http"
	"time"

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

// FrontendMessage represents a message as the frontend expects
type FrontendMessage struct {
	Sender string `json:"sender"` // "user" or "assistant"
	Text   string `json:"text"`
	// You might want to add ID and Timestamp if your frontend needs them for keys/display
	// ID        string    `json:"id,omitempty"`
	// Timestamp time.Time `json:"timestamp,omitempty"`
}

// FrontendConversation represents a conversation as the frontend expects
type FrontendConversation struct {
	ID        string            `json:"id"`
	Title     string            `json:"title"`
	Messages  []FrontendMessage `json:"messages"`
	CreatedAt time.Time         `json:"createdAt"` // Add this for sorting on frontend
}
//get all users conversations and messages
func (h *MedibotHandler) handleUserConvAndMessages(c *gin.Context) {
    userId := c.Query("userId")
    if userId == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "userId query parameter is required"})
        return
    }

    userID, err := uuid.Parse(userId)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }

    // Get the flat list of conversation messages from the database
    // This returns a slice of repo.ListFullConversationsByUserIDRow
    dbRows, err := h.querier.ListFullConversationsByUserID(c, userID)
    if err != nil {
        // If no rows are found, it's not an error, just an empty list
        if errors.Is(err, pgx.ErrNoRows) {
            c.JSON(http.StatusOK, []FrontendConversation{}) // Return empty array
            return
        }
        log.Printf("ERROR: Failed to get full conversations for user %s: %v", userID.String(), err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve conversations"})
        return
    }

    // --- Data Transformation Logic ---
    // Use a map to build conversations, keyed by conversation ID
    conversationsMap := make(map[string]FrontendConversation)
    conversationOrder := []string{} // To maintain the order of conversations as they appear in query results

    for _, row := range dbRows {
        convID := row.ConversationID.String()

        // If conversation not in map, initialize it
        if _, exists := conversationsMap[convID]; !exists {
            conversationsMap[convID] = FrontendConversation{
                ID:        convID,
                Title:     "New Conversation", // Temporary title, will update with first message
                Messages:  []FrontendMessage{},
                CreatedAt: row.ConversationCreatedAt.Time, // Store the conversation's creation time
            }
            conversationOrder = append(conversationOrder, convID) // Add to order list
        }

		// Add message to the conversation
		// Check if message_id is not null (for conversations with no messages yet, LEFT JOIN)
		if row.MessageID != uuid.Nil { // Check if UUID is not zero value
			 // Map sender from DB ('user', 'assistant') to frontend type ('user', 'assistant')
			sender := row.MessageSender // Already matches frontend
			if sender == "" { // Fallback, though your DB constraint should prevent this
				sender = "user"
			}

			msg := FrontendMessage{
				Sender: sender,
				Text:   row.MessageContent,
				// You might add ID and Timestamp here if FrontendMessage struct is updated
				// ID: row.MessageID.String(),
				// Timestamp: row.MessageTimestamp.Time,
			}

			// Append message
			currentConv := conversationsMap[convID]
			currentConv.Messages = append(currentConv.Messages, msg)
			conversationsMap[convID] = currentConv // Update map entry
		}
    }

    // Now, go back through the conversationsMap to set the title
    // and compile into a slice based on the desired order (latest conversation first)
    var frontendConversations []FrontendConversation
    // Re-order by conversation_created_at DESC (which is how your query already orders)
    // Or, you can explicitly sort here if the query order isn't guaranteed
    // For now, let's assume `dbRows` are ordered such that the first message for a conversation
    // is encountered relatively early.

    // A more robust way to get the *actual* first message for the title:
    // After processing all rows, iterate `conversationsMap`
    for _, convID := range conversationOrder {
        conv := conversationsMap[convID]
        if len(conv.Messages) > 0 {
            conv.Title = conv.Messages[0].Text // Set title to the first message's text
        } else {
            conv.Title = "Empty Conversation" // Handle cases with no messages
        }
        frontendConversations = append(frontendConversations, conv)
    }

    // The `conversationOrder` slice will naturally have conversations in `c.created_at DESC`
    // because `dbRows` are already sorted by `c.created_at DESC`.

    c.JSON(http.StatusOK, frontendConversations)
}



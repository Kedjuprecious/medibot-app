package api

import (

	// "strconv"
	// "strings"

	"net/http"

	"github.com/gin-gonic/gin"
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


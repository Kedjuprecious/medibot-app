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
	r.GET("/user/:email", h.handleGetUserByEmail)
	
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
	email := c.Param("email")
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


// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0

package repo

import (
	"context"

	"github.com/google/uuid"
)

type Querier interface {
	CreateConversation(ctx context.Context, userID uuid.UUID) (uuid.UUID, error)
	CreateMessage(ctx context.Context, arg CreateMessageParams) error
	CreateSummaries(ctx context.Context, arg CreateSummariesParams) error
	CreateUser(ctx context.Context, arg CreateUserParams) error
	DeleteConversation(ctx context.Context, id uuid.UUID) error
	GetConMessages(ctx context.Context, id uuid.UUID) ([]Message, error)
	GetConversation(ctx context.Context, arg GetConversationParams) (Conversation, error)
	GetSummary(ctx context.Context, id uuid.UUID) (Summary, error)
	GetUser(ctx context.Context, id uuid.UUID) (User, error)
	GetUserByEmail(ctx context.Context, email string) (User, error)
	ListFullConversationsByUserID(ctx context.Context, userID uuid.UUID) ([]ListFullConversationsByUserIDRow, error)
}

var _ Querier = (*Queries)(nil)

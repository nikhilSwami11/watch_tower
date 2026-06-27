package careerpages

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CareerPage struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID   primitive.ObjectID `bson:"group_id" json:"group_id"`
	URL       string             `bson:"url" json:"url"`
	Label     string             `bson:"label" json:"label"`
	Company   string             `bson:"company" json:"company"`
	AddedBy   primitive.ObjectID `bson:"added_by" json:"added_by"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

// CareerPageWithLastCheck is the enriched view returned by the list endpoint.
// LastCheckedBy and LastCheckedAt are derived from the checks collection at query time.
type CareerPageWithLastCheck struct {
	CareerPage
	LastCheckedBy *primitive.ObjectID `json:"last_checked_by"`
	LastCheckedAt *time.Time          `json:"last_checked_at"`
}

type AddCareerPageRequest struct {
	GroupID string `json:"group_id" validate:"required"`
	URL     string `json:"url" validate:"required,url"`
	Label   string `json:"label" validate:"required,min=1,max=200"`
	Company string `json:"company" validate:"required,min=1,max=100"`
}

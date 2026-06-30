package careerpages

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CareerPage struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	GroupID   primitive.ObjectID   `bson:"group_id" json:"group_id"`
	URL       string               `bson:"url" json:"url"`
	Label     string               `bson:"label" json:"label"`
	Company   string               `bson:"company" json:"company"`
	AddedBy   primitive.ObjectID   `bson:"added_by" json:"added_by"`
	CreatedAt time.Time            `bson:"created_at" json:"created_at"`
	ViewedBy  []primitive.ObjectID `bson:"viewed_by,omitempty" json:"viewed_by"`
	ClickedBy []primitive.ObjectID `bson:"clicked_by,omitempty" json:"clicked_by"`
	AppliedBy []primitive.ObjectID `bson:"applied_by,omitempty" json:"applied_by"`
}

type CareerPageWithLastCheck struct {
	CareerPage
	LastCheckedBy *primitive.ObjectID `json:"last_checked_by"`
	LastCheckedAt *time.Time          `json:"last_checked_at"`
}

type AddCareerPageRequest struct {
	URL     string `json:"url" validate:"required,url"`
	Label   string `json:"label" validate:"max=200"`
	Company string `json:"company" validate:"required,min=1,max=100"`
}

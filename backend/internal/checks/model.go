package checks

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Check struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CareerPageID   primitive.ObjectID `bson:"career_page_id" json:"career_page_id"`
	UserID         primitive.ObjectID `bson:"user_id" json:"user_id"`
	CheckedAt      time.Time          `bson:"checked_at" json:"checked_at"`
	FoundSomething bool               `bson:"found_something" json:"found_something"`
	Note           string             `bson:"note,omitempty" json:"note,omitempty"`
}

// LastChecked holds the result of the "most recent check" computation,
// used by the career pages list endpoint to show staleness per page.
type LastChecked struct {
	UserID    primitive.ObjectID
	CheckedAt time.Time
}

// MostRecent returns the most recently checked entry from a slice of checks,
// or nil if the slice is empty. This is the pure function unit-tested in checks_test.go.
func MostRecent(cs []Check) *LastChecked {
	if len(cs) == 0 {
		return nil
	}
	latest := cs[0]
	for _, c := range cs[1:] {
		if c.CheckedAt.After(latest.CheckedAt) {
			latest = c
		}
	}
	return &LastChecked{UserID: latest.UserID, CheckedAt: latest.CheckedAt}
}

type LogCheckRequest struct {
	CareerPageID   string `json:"career_page_id" validate:"required"`
	FoundSomething bool   `json:"found_something"`
	Note           string `json:"note" validate:"max=500"`
}

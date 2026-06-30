package groups

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Group struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name       string             `bson:"name" json:"name"`
	InviteCode string             `bson:"invite_code" json:"invite_code"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
}

// GroupMember lives here rather than in a separate members package because
// group creation and membership are inseparable — a group without its initial
// admin member is invalid. Other feature packages (careerpages, checks) import
// this package's Repository to call IsMember for access control.
type GroupMember struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	GroupID  primitive.ObjectID `bson:"group_id" json:"group_id"`
	UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	JoinedAt time.Time          `bson:"joined_at" json:"joined_at"`
	Role     string             `bson:"role" json:"role"` // "admin" | "member"
}

type MemberWithUser struct {
	GroupMember
	Name  string `json:"name"`
	Email string `json:"email"`
}

type CreateGroupRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

type JoinGroupRequest struct {
	InviteCode string `json:"invite_code" validate:"required"`
}

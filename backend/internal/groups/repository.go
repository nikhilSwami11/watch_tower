package groups

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	groups  *mongo.Collection
	members *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{
		groups:  db.Collection("groups"),
		members: db.Collection("group_members"),
	}
}

func (r *Repository) EnsureIndexes(ctx context.Context) error {
	_, err := r.groups.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "invite_code", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}
	// prevents a user from joining the same group twice
	_, err = r.members.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "group_id", Value: 1}, {Key: "user_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

// Create inserts a new group and makes creatorID its admin in one logical operation.
func (r *Repository) Create(ctx context.Context, name string, creatorID primitive.ObjectID) (*Group, error) {
	code, err := generateInviteCode()
	if err != nil {
		return nil, err
	}

	group := &Group{
		ID:         primitive.NewObjectID(),
		Name:       name,
		InviteCode: code,
		CreatedAt:  time.Now().UTC(),
	}
	if _, err := r.groups.InsertOne(ctx, group); err != nil {
		return nil, err
	}

	member := GroupMember{
		ID:       primitive.NewObjectID(),
		GroupID:  group.ID,
		UserID:   creatorID,
		JoinedAt: time.Now().UTC(),
		Role:     "admin",
	}
	if _, err := r.members.InsertOne(ctx, member); err != nil {
		return nil, err
	}

	return group, nil
}

func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (*Group, error) {
	var g Group
	err := r.groups.FindOne(ctx, bson.M{"_id": id}).Decode(&g)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *Repository) FindByInviteCode(ctx context.Context, code string) (*Group, error) {
	var g Group
	err := r.groups.FindOne(ctx, bson.M{"invite_code": code}).Decode(&g)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// ListForUser returns all groups the user belongs to.
func (r *Repository) ListForUser(ctx context.Context, userID primitive.ObjectID) ([]Group, error) {
	cur, err := r.members.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var memberships []GroupMember
	if err := cur.All(ctx, &memberships); err != nil {
		return nil, err
	}
	if len(memberships) == 0 {
		return []Group{}, nil
	}

	groupIDs := make([]primitive.ObjectID, len(memberships))
	for i, m := range memberships {
		groupIDs[i] = m.GroupID
	}

	cur2, err := r.groups.Find(ctx, bson.M{"_id": bson.M{"$in": groupIDs}})
	if err != nil {
		return nil, err
	}
	defer cur2.Close(ctx)

	var result []Group
	if err := cur2.All(ctx, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// IsMember reports whether userID is a member of groupID.
// Used by careerpages and checks handlers to gate access without duplicating logic.
func (r *Repository) IsMember(ctx context.Context, groupID, userID primitive.ObjectID) (bool, error) {
	count, err := r.members.CountDocuments(ctx, bson.M{"group_id": groupID, "user_id": userID})
	return count > 0, err
}

func (r *Repository) AddMember(ctx context.Context, groupID, userID primitive.ObjectID) (*GroupMember, error) {
	m := &GroupMember{
		ID:       primitive.NewObjectID(),
		GroupID:  groupID,
		UserID:   userID,
		JoinedAt: time.Now().UTC(),
		Role:     "member",
	}
	_, err := r.members.InsertOne(ctx, m)
	return m, err
}

func (r *Repository) ListMembers(ctx context.Context, groupID primitive.ObjectID) ([]GroupMember, error) {
	cur, err := r.members.Find(ctx, bson.M{"group_id": groupID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var result []GroupMember
	if err := cur.All(ctx, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// generateInviteCode returns 12 random hex characters (6 bytes).
func generateInviteCode() (string, error) {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

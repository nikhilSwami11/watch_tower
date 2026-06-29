package auth

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	col *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{col: db.Collection("users")}
}

func (r *Repository) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "google_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
	})
	return err
}

func (r *Repository) Create(ctx context.Context, email, name, passwordHash string) (*User, error) {
	user := &User{
		ID:           primitive.NewObjectID(),
		Email:        email,
		Name:         name,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
	}
	_, err := r.col.InsertOne(ctx, user)
	return user, err
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.col.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) FindByGoogleID(ctx context.Context, googleID string) (*User, error) {
	var user User
	err := r.col.FindOne(ctx, bson.M{"google_id": googleID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) CreateGoogleUser(ctx context.Context, googleID, email, name string) (*User, error) {
	user := &User{
		ID:        primitive.NewObjectID(),
		Email:     email,
		Name:      name,
		GoogleID:  googleID,
		CreatedAt: time.Now().UTC(),
	}
	_, err := r.col.InsertOne(ctx, user)
	return user, err
}

func (r *Repository) LinkGoogleID(ctx context.Context, userID primitive.ObjectID, googleID string) error {
	_, err := r.col.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"google_id": googleID}},
	)
	return err
}

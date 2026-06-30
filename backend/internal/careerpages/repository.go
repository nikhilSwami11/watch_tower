package careerpages

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	pages *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{pages: db.Collection("career_pages")}
}

func (r *Repository) EnsureIndexes(ctx context.Context) error {
	_, err := r.pages.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "group_id", Value: 1}, {Key: "created_at", Value: -1}},
	})
	return err
}

func (r *Repository) Add(ctx context.Context, groupID, userID primitive.ObjectID, url, label, company string) (*CareerPage, error) {
	cp := &CareerPage{
		ID:        primitive.NewObjectID(),
		GroupID:   groupID,
		URL:       url,
		Label:     label,
		Company:   company,
		AddedBy:   userID,
		CreatedAt: time.Now().UTC(),
	}
	_, err := r.pages.InsertOne(ctx, cp)
	return cp, err
}

func (r *Repository) ListByGroup(ctx context.Context, groupID primitive.ObjectID) ([]CareerPage, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.pages.Find(ctx, bson.M{"group_id": groupID}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var result []CareerPage
	if err := cur.All(ctx, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (*CareerPage, error) {
	var cp CareerPage
	err := r.pages.FindOne(ctx, bson.M{"_id": id}).Decode(&cp)
	if err != nil {
		return nil, err
	}
	return &cp, nil
}

func (r *Repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.pages.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// MarkUserAction adds userID to the given field array (viewed_by, clicked_by, applied_by) using $addToSet.
func (r *Repository) MarkUserAction(ctx context.Context, pageID, userID primitive.ObjectID, field string) error {
	_, err := r.pages.UpdateOne(ctx,
		bson.M{"_id": pageID},
		bson.M{"$addToSet": bson.M{field: userID}},
	)
	return err
}

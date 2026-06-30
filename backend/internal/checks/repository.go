package checks

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository struct {
	checks *mongo.Collection
}

func NewRepository(db *mongo.Database) *Repository {
	return &Repository{checks: db.Collection("checks")}
}

func (r *Repository) EnsureIndexes(ctx context.Context) error {
	_, err := r.checks.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "career_page_id", Value: 1}, {Key: "checked_at", Value: -1}},
	})
	return err
}

func (r *Repository) Log(ctx context.Context, careerPageID, userID primitive.ObjectID, foundSomething bool, note string) (*Check, error) {
	c := &Check{
		ID:             primitive.NewObjectID(),
		CareerPageID:   careerPageID,
		UserID:         userID,
		CheckedAt:      time.Now().UTC(),
		FoundSomething: foundSomething,
		Note:           note,
	}
	_, err := r.checks.InsertOne(ctx, c)
	return c, err
}

func (r *Repository) ListByPage(ctx context.Context, careerPageID primitive.ObjectID) ([]Check, error) {
	opts := options.Find().SetSort(bson.D{{Key: "checked_at", Value: -1}})
	cur, err := r.checks.Find(ctx, bson.M{"career_page_id": careerPageID}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var result []Check
	if err := cur.All(ctx, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// MostRecentByPages returns the latest check per career page for the given page IDs.
// Used by the career pages list handler to show staleness at a glance.
func (r *Repository) MostRecentByPages(ctx context.Context, pageIDs []primitive.ObjectID) (map[primitive.ObjectID]LastChecked, error) {
	if len(pageIDs) == 0 {
		return map[primitive.ObjectID]LastChecked{}, nil
	}

	type aggRow struct {
		ID        primitive.ObjectID `bson:"_id"`
		UserID    primitive.ObjectID `bson:"user_id"`
		CheckedAt time.Time          `bson:"checked_at"`
	}

	pipeline := bson.A{
		bson.M{"$match": bson.M{"career_page_id": bson.M{"$in": pageIDs}}},
		bson.M{"$sort": bson.M{"checked_at": -1}},
		bson.M{"$group": bson.M{
			"_id":        "$career_page_id",
			"user_id":    bson.M{"$first": "$user_id"},
			"checked_at": bson.M{"$first": "$checked_at"},
		}},
	}

	cur, err := r.checks.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	result := make(map[primitive.ObjectID]LastChecked, len(pageIDs))
	for cur.Next(ctx) {
		var row aggRow
		if err := cur.Decode(&row); err != nil {
			return nil, err
		}
		result[row.ID] = LastChecked{UserID: row.UserID, CheckedAt: row.CheckedAt}
	}
	return result, cur.Err()
}

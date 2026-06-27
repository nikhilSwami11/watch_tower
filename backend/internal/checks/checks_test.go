package checks

import (
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMostRecent_empty(t *testing.T) {
	if got := MostRecent(nil); got != nil {
		t.Errorf("MostRecent(nil) = %v, want nil", got)
	}
	if got := MostRecent([]Check{}); got != nil {
		t.Errorf("MostRecent([]) = %v, want nil", got)
	}
}

func TestMostRecent_single(t *testing.T) {
	now := time.Now()
	uid := primitive.NewObjectID()
	checks := []Check{{UserID: uid, CheckedAt: now}}

	got := MostRecent(checks)
	if got == nil {
		t.Fatal("MostRecent returned nil for non-empty slice")
	}
	if got.UserID != uid {
		t.Errorf("UserID = %v, want %v", got.UserID, uid)
	}
	if !got.CheckedAt.Equal(now) {
		t.Errorf("CheckedAt = %v, want %v", got.CheckedAt, now)
	}
}

func TestMostRecent_picksLatest(t *testing.T) {
	base := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	older := primitive.NewObjectID()
	newest := primitive.NewObjectID()

	checks := []Check{
		{UserID: older, CheckedAt: base},
		{UserID: newest, CheckedAt: base.Add(2 * time.Hour)},
		{UserID: primitive.NewObjectID(), CheckedAt: base.Add(1 * time.Hour)},
	}

	got := MostRecent(checks)
	if got == nil {
		t.Fatal("MostRecent returned nil")
	}
	if got.UserID != newest {
		t.Errorf("got UserID %v, want %v (the newest checker)", got.UserID, newest)
	}
}

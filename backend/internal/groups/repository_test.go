package groups

import (
	"encoding/hex"
	"testing"
)

func TestGenerateInviteCode_format(t *testing.T) {
	code, err := generateInviteCode()
	if err != nil {
		t.Fatalf("generateInviteCode() error = %v", err)
	}
	// 6 random bytes encoded as hex = 12 characters
	if len(code) != 12 {
		t.Errorf("len = %d, want 12", len(code))
	}
	if _, err := hex.DecodeString(code); err != nil {
		t.Errorf("not valid hex: %v", err)
	}
}

func TestGenerateInviteCode_uniqueness(t *testing.T) {
	seen := make(map[string]struct{}, 100)
	for i := range 100 {
		_ = i
		code, err := generateInviteCode()
		if err != nil {
			t.Fatalf("generateInviteCode() error = %v", err)
		}
		if _, dup := seen[code]; dup {
			t.Errorf("duplicate invite code generated: %s", code)
		}
		seen[code] = struct{}{}
	}
}

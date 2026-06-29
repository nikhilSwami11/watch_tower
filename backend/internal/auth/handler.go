package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"watch-tower/internal/respond"
)

type Handler struct {
	repo           *Repository
	jwtSecret      string
	jwtExpiry      time.Duration
	googleClientID string
	validate       interface{ Struct(any) error }
}

func NewHandler(repo *Repository, jwtSecret string, jwtExpiry time.Duration, googleClientID string) *Handler {
	return &Handler{
		repo:           repo,
		jwtSecret:      jwtSecret,
		jwtExpiry:      jwtExpiry,
		googleClientID: googleClientID,
		validate:       respond.NewValidator(),
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	existing, err := h.repo.FindByEmail(r.Context(), req.Email)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}
	if existing != nil {
		respond.Error(w, http.StatusConflict, "email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	user, err := h.repo.Create(r.Context(), req.Email, req.Name, string(hash))
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not create user")
		return
	}

	token, err := h.issueToken(user.ID.Hex())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	respond.JSON(w, http.StatusCreated, AuthResponse{Token: token, User: *user})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	user, err := h.repo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			respond.Error(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		respond.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := h.issueToken(user.ID.Hex())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	respond.JSON(w, http.StatusOK, AuthResponse{Token: token, User: *user})
}

// googleTokenInfo is what Google's tokeninfo endpoint returns for a valid ID token.
type googleTokenInfo struct {
	Sub           string `json:"sub"`   // unique Google user ID
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Aud           string `json:"aud"` // should match our client ID
	Error         string `json:"error"`
}

func (h *Handler) GoogleSignIn(w http.ResponseWriter, r *http.Request) {
	var req GoogleSignInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	// Ask Google to verify the ID token. This call validates the signature,
	// expiry, and issuer — we don't need any Google libraries for this.
	info, err := verifyGoogleToken(r.Context(), req.Credential)
	if err != nil {
		respond.Error(w, http.StatusUnauthorized, "invalid Google token")
		return
	}

	// Optionally verify the token was issued for *our* app, not some other
	// Google OAuth client.
	if h.googleClientID != "" && info.Aud != h.googleClientID {
		respond.Error(w, http.StatusUnauthorized, "token audience mismatch")
		return
	}
	if info.EmailVerified != "true" {
		respond.Error(w, http.StatusUnauthorized, "Google email not verified")
		return
	}

	// 1. Known Google user → sign in immediately.
	user, err := h.repo.FindByGoogleID(r.Context(), info.Sub)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	if user == nil {
		// 2. Email/password account with same email → link it.
		user, err = h.repo.FindByEmail(r.Context(), info.Email)
		if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
			respond.Error(w, http.StatusInternalServerError, "internal error")
			return
		}
		if user != nil {
			if err := h.repo.LinkGoogleID(r.Context(), user.ID, info.Sub); err != nil {
				respond.Error(w, http.StatusInternalServerError, "internal error")
				return
			}
		}
	}

	if user == nil {
		// 3. Brand new user — create them.
		user, err = h.repo.CreateGoogleUser(r.Context(), info.Sub, info.Email, info.Name)
		if err != nil {
			respond.Error(w, http.StatusInternalServerError, "could not create user")
			return
		}
	}

	token, err := h.issueToken(user.ID.Hex())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	respond.JSON(w, http.StatusOK, AuthResponse{Token: token, User: *user})
}

func verifyGoogleToken(ctx context.Context, credential string) (*googleTokenInfo, error) {
	url := "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var info googleTokenInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}
	if info.Error != "" {
		return nil, fmt.Errorf("google tokeninfo: %s", info.Error)
	}
	if info.Sub == "" {
		return nil, fmt.Errorf("google tokeninfo: missing sub")
	}
	return &info, nil
}

func (h *Handler) issueToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(h.jwtExpiry).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.jwtSecret))
}

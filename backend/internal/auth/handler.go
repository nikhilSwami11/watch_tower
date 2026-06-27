package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"watch-tower/internal/respond"
)

type Handler struct {
	repo      *Repository
	jwtSecret string
	jwtExpiry time.Duration
	validate  interface{ Struct(any) error }
}

func NewHandler(repo *Repository, jwtSecret string, jwtExpiry time.Duration) *Handler {
	return &Handler{
		repo:      repo,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
		validate:  respond.NewValidator(),
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

func (h *Handler) issueToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(h.jwtExpiry).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.jwtSecret))
}

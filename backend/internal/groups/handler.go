package groups

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"watch-tower/internal/auth"
	"watch-tower/internal/middleware"
	"watch-tower/internal/respond"
)

type Handler struct {
	repo     *Repository
	authRepo *auth.Repository
	validate interface{ Struct(any) error }
}

func NewHandler(repo *Repository, authRepo *auth.Repository) *Handler {
	return &Handler{repo: repo, authRepo: authRepo, validate: respond.NewValidator()}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	var req CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	group, err := h.repo.Create(r.Context(), req.Name, userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not create group")
		return
	}
	respond.JSON(w, http.StatusCreated, group)
}

func (h *Handler) Join(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	var req JoinGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	group, err := h.repo.FindByInviteCode(r.Context(), req.InviteCode)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			respond.Error(w, http.StatusNotFound, "invalid invite code")
			return
		}
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	already, err := h.repo.IsMember(r.Context(), group.ID, userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}
	if already {
		respond.Error(w, http.StatusConflict, "already a member of this group")
		return
	}

	member, err := h.repo.AddMember(r.Context(), group.ID, userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not join group")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"group": group, "member": member})
}

func (h *Handler) ListMyGroups(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	groups, err := h.repo.ListForUser(r.Context(), userID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not list groups")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"groups": groups})
}

func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	groupID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "groupID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid group ID")
		return
	}

	if ok, err := h.repo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !ok {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	members, err := h.repo.ListMembers(r.Context(), groupID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not list members")
		return
	}

	userIDs := make([]primitive.ObjectID, len(members))
	for i, m := range members {
		userIDs[i] = m.UserID
	}
	users, err := h.authRepo.FindManyByIDs(r.Context(), userIDs)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not load member info")
		return
	}
	userByID := make(map[primitive.ObjectID]*auth.User, len(users))
	for i := range users {
		userByID[users[i].ID] = &users[i]
	}

	enriched := make([]MemberWithUser, len(members))
	for i, m := range members {
		enriched[i].GroupMember = m
		if u, ok := userByID[m.UserID]; ok {
			enriched[i].Name = u.Name
			enriched[i].Email = u.Email
		}
	}

	respond.JSON(w, http.StatusOK, map[string]any{"members": enriched})
}

// mustUserID extracts the authenticated user's ObjectID from context.
// Writes an error response and returns false if it cannot.
func mustUserID(w http.ResponseWriter, r *http.Request) (primitive.ObjectID, bool) {
	idStr, ok := middleware.GetUserID(r.Context())
	if !ok {
		respond.Error(w, http.StatusUnauthorized, "unauthorized")
		return primitive.NilObjectID, false
	}
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		respond.Error(w, http.StatusUnauthorized, "unauthorized")
		return primitive.NilObjectID, false
	}
	return id, true
}

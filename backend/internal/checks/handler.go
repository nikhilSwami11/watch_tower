package checks

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"watch-tower/internal/groups"
	"watch-tower/internal/middleware"
	"watch-tower/internal/respond"
)

type Handler struct {
	repo       *Repository
	groupsRepo *groups.Repository
	validate   interface{ Struct(any) error }
}

func NewHandler(repo *Repository, groupsRepo *groups.Repository) *Handler {
	return &Handler{
		repo:       repo,
		groupsRepo: groupsRepo,
		validate:   respond.NewValidator(),
	}
}

func (h *Handler) Log(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	groupID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "groupID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid group ID")
		return
	}

	pageID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "pageID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid page ID")
		return
	}

	if isMember, err := h.groupsRepo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !isMember {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	var req LogCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	check, err := h.repo.Log(r.Context(), pageID, userID, req.FoundSomething, req.Note)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not log check")
		return
	}
	respond.JSON(w, http.StatusCreated, check)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	groupID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "groupID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid group ID")
		return
	}

	pageID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "pageID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid page ID")
		return
	}

	if isMember, err := h.groupsRepo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !isMember {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	checkList, err := h.repo.ListByPage(r.Context(), pageID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not list checks")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"checks": checkList})
}

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

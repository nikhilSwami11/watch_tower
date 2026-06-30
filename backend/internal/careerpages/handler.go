package careerpages

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"watch-tower/internal/checks"
	"watch-tower/internal/groups"
	"watch-tower/internal/middleware"
	"watch-tower/internal/respond"
)

type Handler struct {
	repo       *Repository
	checksRepo *checks.Repository
	groupsRepo *groups.Repository
	validate   interface{ Struct(any) error }
}

func NewHandler(repo *Repository, checksRepo *checks.Repository, groupsRepo *groups.Repository) *Handler {
	return &Handler{
		repo:       repo,
		checksRepo: checksRepo,
		groupsRepo: groupsRepo,
		validate:   respond.NewValidator(),
	}
}

func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := mustUserID(w, r)
	if !ok {
		return
	}

	groupID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "groupID"))
	if err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid group ID")
		return
	}

	if isMember, err := h.groupsRepo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !isMember {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	var req AddCareerPageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		respond.ValidationError(w, err)
		return
	}

	label := req.Label
	if label == "" {
		label = req.Company
	}
	cp, err := h.repo.Add(r.Context(), groupID, userID, req.URL, label, req.Company)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not add career page")
		return
	}
	respond.JSON(w, http.StatusCreated, cp)
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

	if isMember, err := h.groupsRepo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !isMember {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	pages, err := h.repo.ListByGroup(r.Context(), groupID)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not list career pages")
		return
	}

	pageIDs := make([]primitive.ObjectID, len(pages))
	for i, p := range pages {
		pageIDs[i] = p.ID
	}

	lastChecks, err := h.checksRepo.MostRecentByPages(r.Context(), pageIDs)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not load check history")
		return
	}

	enriched := make([]CareerPageWithLastCheck, len(pages))
	for i, p := range pages {
		enriched[i] = CareerPageWithLastCheck{CareerPage: p}
		if lc, ok := lastChecks[p.ID]; ok {
			uid := lc.UserID
			t := lc.CheckedAt
			enriched[i].LastCheckedBy = &uid
			enriched[i].LastCheckedAt = &t
		}
	}

	respond.JSON(w, http.StatusOK, map[string]any{"career_pages": enriched})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
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

	cp, err := h.repo.FindByID(r.Context(), pageID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			respond.Error(w, http.StatusNotFound, "career page not found")
			return
		}
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	if cp.GroupID != groupID {
		respond.Error(w, http.StatusNotFound, "career page not found")
		return
	}

	if cp.AddedBy != userID {
		respond.Error(w, http.StatusForbidden, "only the person who added this page can delete it")
		return
	}

	if err := h.repo.Delete(r.Context(), pageID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not delete career page")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"deleted": true})
}

// Mark handles POST .../viewed, .../clicked, .../applied
func (h *Handler) Mark(w http.ResponseWriter, r *http.Request) {
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

	action := chi.URLParam(r, "action")
	fieldMap := map[string]string{
		"viewed":  "viewed_by",
		"clicked": "clicked_by",
		"applied": "applied_by",
	}
	field, valid := fieldMap[action]
	if !valid {
		respond.Error(w, http.StatusBadRequest, "action must be viewed, clicked, or applied")
		return
	}

	if isMember, err := h.groupsRepo.IsMember(r.Context(), groupID, userID); err != nil {
		respond.Error(w, http.StatusInternalServerError, "internal error")
		return
	} else if !isMember {
		respond.Error(w, http.StatusForbidden, "not a member of this group")
		return
	}

	if err := h.repo.MarkUserAction(r.Context(), pageID, userID, field); err != nil {
		respond.Error(w, http.StatusInternalServerError, "could not mark action")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"ok": true})
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

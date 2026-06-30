package checks

import "github.com/go-chi/chi/v5"

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/groups/{groupID}/career-pages/{pageID}/checks", h.Log)
	r.Get("/groups/{groupID}/career-pages/{pageID}/checks", h.List)
}

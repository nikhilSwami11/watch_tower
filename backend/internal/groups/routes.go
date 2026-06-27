package groups

import "github.com/go-chi/chi/v5"

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/groups", h.Create)
	r.Post("/groups/join", h.Join)
	r.Get("/groups", h.ListMyGroups)
	r.Get("/groups/{groupID}/members", h.ListMembers)
}

package careerpages

import "github.com/go-chi/chi/v5"

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/groups/{groupID}/career-pages", h.Add)
	r.Get("/groups/{groupID}/career-pages", h.List)
	r.Delete("/groups/{groupID}/career-pages/{pageID}", h.Delete)
	r.Post("/groups/{groupID}/career-pages/{pageID}/{action}", h.Mark)
}

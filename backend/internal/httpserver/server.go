package httpserver

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"watch-tower/internal/auth"
	"watch-tower/internal/groups"
	"watch-tower/internal/middleware"
)

type Config struct {
	Port      string
	JWTSecret string
}

// New wires all feature routes onto a chi router and returns a configured http.Server.
// Add new feature handlers here as they are built.
func New(cfg Config, authH *auth.Handler, groupsH *groups.Handler) *http.Server {
	r := chi.NewRouter()

	r.Use(chimiddleware.Recoverer) // prevents panics from reaching the client
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		// public — no JWT required
		authH.RegisterRoutes(r)

		// authenticated — JWT required for everything below
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))
			groupsH.RegisterRoutes(r)
			// careerpagesH.RegisterRoutes(r)  ← add here in next phase
			// checksH.RegisterRoutes(r)        ← add here in next phase
		})
	})

	return &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

package httpserver

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"watch-tower/internal/auth"
	"watch-tower/internal/careerpages"
	"watch-tower/internal/checks"
	"watch-tower/internal/groups"
	"watch-tower/internal/middleware"
)

type Config struct {
	Port          string
	JWTSecret     string
	AllowedOrigin string
}

// New wires all feature routes onto a chi router and returns a configured http.Server.
func New(cfg Config, authH *auth.Handler, groupsH *groups.Handler, careerPagesH *careerpages.Handler, checksH *checks.Handler) *http.Server {
	r := chi.NewRouter()

	r.Use(chimiddleware.Recoverer) // prevents panics from reaching the client
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigin},
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
			careerPagesH.RegisterRoutes(r)
			checksH.RegisterRoutes(r)
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

package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"watch-tower/internal/auth"
	"watch-tower/internal/config"
	"watch-tower/internal/db"
	"watch-tower/internal/groups"
	"watch-tower/internal/httpserver"
)

func main() {
	// Load .env if present; in production env vars come from the host, so this is a no-op.
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "err", err)
		os.Exit(1)
	}

	mongoClient, err := db.Connect(cfg.MongoURI)
	if err != nil {
		slog.Error("mongodb connection failed", "err", err)
		os.Exit(1)
	}

	database := mongoClient.Database(cfg.DBName)

	// repositories
	authRepo := auth.NewRepository(database)
	groupsRepo := groups.NewRepository(database)

	// ensure indexes exist (idempotent — safe to call on every startup)
	idxCtx, idxCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer idxCancel()
	if err := authRepo.EnsureIndexes(idxCtx); err != nil {
		slog.Error("failed to ensure auth indexes", "err", err)
		os.Exit(1)
	}
	if err := groupsRepo.EnsureIndexes(idxCtx); err != nil {
		slog.Error("failed to ensure groups indexes", "err", err)
		os.Exit(1)
	}

	// handlers
	authHandler := auth.NewHandler(authRepo, cfg.JWTSecret, cfg.JWTExpiry, cfg.GoogleClientID)
	groupsHandler := groups.NewHandler(groupsRepo)

	srv := httpserver.New(
		httpserver.Config{Port: cfg.Port, JWTSecret: cfg.JWTSecret},
		authHandler,
		groupsHandler,
	)

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		slog.Error("graceful shutdown failed", "err", err)
	}
	if err := mongoClient.Disconnect(shutCtx); err != nil {
		slog.Error("mongodb disconnect failed", "err", err)
	}
	slog.Info("server stopped")
}

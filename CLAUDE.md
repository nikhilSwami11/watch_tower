# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo layout

```
watch_tower/
├── backend/    ← Go REST API (active)
└── frontend/   ← not yet created
```

## Backend commands

All commands run from `backend/`:

```bash
go run ./cmd/api          # start dev server (reads .env)
go test ./...             # run all tests
go test ./internal/groups # run tests for one package
go build ./...            # compile-check everything
```

Env vars are loaded from `backend/.env` (not committed). Copy `backend/.env.example` to get started. Required: `MONGO_URI`, `JWT_SECRET`.

## Backend architecture

**Feature-based, not layer-based.** Each domain (`auth`, `groups`, `careerpages`, `checks`) owns its own `model.go`, `repository.go`, `handler.go`, and `routes.go`. There is no shared `/models` or `/controllers` directory.

**The pattern for every feature:**
1. `model.go` — MongoDB document structs (bson + json tags) and request/response types with validate tags
2. `repository.go` — all MongoDB operations for this feature's collections; `EnsureIndexes` called at startup
3. `handler.go` — HTTP handlers; each calls `mustUserID` to extract the authenticated user, validates input via `respond.NewValidator()`, delegates to the repository
4. `routes.go` — single `RegisterRoutes(r chi.Router)` method wired in `httpserver/server.go`

**Wiring new features:** add the repo + handler construction to `cmd/api/main.go`, then call `handler.RegisterRoutes(r)` inside the authenticated group in `internal/httpserver/server.go`.

**Cross-cutting concerns:**
- `internal/respond` — single source of truth for all JSON responses (`respond.JSON`, `respond.Error`, `respond.ValidationError`). All handlers use this; never write `json.NewEncoder` directly in a handler.
- `internal/middleware.GetUserID(ctx)` — extracts the authenticated user's string ID from context (set by `middleware.Authenticate`). Handlers convert it to `primitive.ObjectID` via `mustUserID` helper defined in each handler file.
- `groups.Repository.IsMember(ctx, groupID, userID)` — the shared membership gate. `careerpages` and `checks` handlers take `*groups.Repository` as a dependency to call this rather than duplicating the logic.

**MongoDB:** Atlas free tier. All collections use `primitive.ObjectID` as `_id`. References between collections are plain ObjectIDs (no embedding except where it makes sense). The `checks` collection is kept separate (not embedded in `career_pages`) to support independent querying of check history.

**Auth:** JWT HS256, 7-day expiry. The token `sub` claim holds the user's hex ObjectID string. `middleware.Authenticate` validates the token and injects the user ID; it is applied to the entire authenticated route group in `httpserver/server.go`, so individual handlers do not re-validate the token.

**Module name:** `watch-tower` (local, no GitHub path). All internal imports are `watch-tower/internal/...`.

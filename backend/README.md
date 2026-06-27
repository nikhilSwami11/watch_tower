# Backend

Go REST API for Watch Tower. See the [root README](../README.md) for project context.

## Folder Structure

```
backend/
├── cmd/api/main.go          ← entry point: wires deps, starts server, handles shutdown
├── internal/
│   ├── config/              ← env var loading into a typed Config struct
│   ├── db/                  ← MongoDB client setup
│   ├── respond/             ← shared JSON response helpers (Error, JSON, ValidationError)
│   ├── middleware/
│   │   ├── auth.go          ← JWT validation, injects user_id into context
│   │   └── logging.go       ← structured request logger (method/path/status/latency)
│   ├── auth/                ← register, login · users collection
│   ├── groups/              ← create group, join via invite code, list groups, list members
│   ├── careerpages/         ← model stub (handlers in next phase)
│   ├── checks/              ← model + MostRecent logic + unit tests (handlers in next phase)
│   └── httpserver/          ← chi router setup, route registration
└── pkg/                     ← (empty — only for code truly reusable outside /internal)
```

Each feature package owns its own model, repository, and handler. `groups.Repository.IsMember` is the shared helper other features use to gate group access.

## Running Locally

```bash
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
go mod tidy
go run ./cmd/api
```

## Running Tests

```bash
go test ./...
```

## Docker

```bash
# go.sum must exist (run go mod tidy first)
docker build -t watch-tower .

docker run -p 8080:8080 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e DB_NAME="watch_tower" \
  watch-tower
```

## API Reference

All endpoints except auth require `Authorization: Bearer <token>`.

Errors: `{"error": "message"}` · Validation errors: `{"error": "validation failed", "fields": {...}}`

### Auth
| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/auth/register` | `{email, password, name}` |
| POST | `/api/v1/auth/login` | `{email, password}` |

### Groups
| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/groups` | `{name}` |
| POST | `/api/v1/groups/join` | `{invite_code}` |
| GET | `/api/v1/groups` | — |
| GET | `/api/v1/groups/{groupID}/members` | — |

### Career Pages _(next phase)_
| Method | Path |
|--------|------|
| POST | `/api/v1/groups/{groupID}/career-pages` |
| GET | `/api/v1/groups/{groupID}/career-pages` |
| DELETE | `/api/v1/career-pages/{pageID}` |

### Checks _(next phase)_
| Method | Path |
|--------|------|
| POST | `/api/v1/career-pages/{pageID}/checks` |
| GET | `/api/v1/career-pages/{pageID}/checks` |

## Adding Points/Leaderboard (Future)

Add a `points_log` collection — no changes to existing collections needed:
```json
{ "_id": "...", "user_id": "...", "group_id": "...", "action": "check", "points": 1, "created_at": "..." }
```

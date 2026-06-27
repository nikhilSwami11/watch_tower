# Watch Tower

A shared career-page tracker for small groups of friends. Instead of tracking individual job postings, you track the *search pages* themselves — a filtered Amazon/Google/Meta jobs URL — and log when you last checked it. The dashboard shows which pages are going stale so your group knows where to focus.

## Monorepo Structure

```
watch_tower/
├── backend/    ← Go REST API
└── frontend/   ← (coming soon)
```

## Stack

| Layer | Tech |
|-------|------|
| Backend | Go 1.23, chi router, MongoDB Atlas |
| Auth | JWT (HS256, 7-day expiry) |
| Frontend | TBD |

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
go mod tidy
go run ./cmd/api
# API is live at http://localhost:8080
```

See [`backend/README.md`](backend/README.md) for the full API reference and Docker instructions.

### Frontend

Coming soon.

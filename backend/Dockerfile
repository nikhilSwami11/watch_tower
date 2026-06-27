# ---- Build Stage ----
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/api

# ---- Run Stage ----
FROM alpine:3.20

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/server /server

USER app

EXPOSE 8080

ENTRYPOINT ["/server"]

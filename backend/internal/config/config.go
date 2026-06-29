package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	MongoURI       string
	DBName         string
	JWTSecret      string
	JWTExpiry      time.Duration
	Port           string
	GoogleClientID string
}

func Load() (*Config, error) {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		return nil, fmt.Errorf("MONGO_URI is required")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "watch_tower"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	expiryDays := 7
	if v := os.Getenv("JWT_EXPIRY_DAYS"); v != "" {
		if d, err := strconv.Atoi(v); err == nil && d > 0 {
			expiryDays = d
		}
	}

	return &Config{
		MongoURI:       mongoURI,
		DBName:         dbName,
		JWTSecret:      jwtSecret,
		JWTExpiry:      time.Duration(expiryDays) * 24 * time.Hour,
		Port:           port,
		GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
	}, nil
}

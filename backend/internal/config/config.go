package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Host      string
	Port      string
	User      string
	Password  string
	Name      string
	SSLMode   string
	RecapYear int
}

func (c Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host,
		c.Port,
		c.User,
		c.Password,
		c.Name,
		c.SSLMode,
	)
}

func NewConfig() (Config, error) {
	LoadEnv()

	cfg := Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Name:     os.Getenv("DB_NAME"),
		SSLMode:  os.Getenv("DB_SSLMODE"),
	}

	if cfg.Host == "" {
		return Config{}, fmt.Errorf("DB_HOST is required")
	}

	if cfg.Port == "" {
		cfg.Port = "5432"
	}

	if cfg.User == "" {
		return Config{}, fmt.Errorf("DB_USER is required")
	}

	if cfg.Password == "" {
		return Config{}, fmt.Errorf("DB_PASSWORD is required")
	}

	if cfg.Name == "" {
		return Config{}, fmt.Errorf("DB_NAME is required")
	}

	if cfg.SSLMode == "" {
		cfg.SSLMode = "disable"
	}

	recapYear, err := requiredPositiveInt("RECAP_YEAR")
	if err != nil {
		return Config{}, err
	}
	cfg.RecapYear = recapYear

	return cfg, nil
}

func LoadEnv() {
	_ = godotenv.Load(
		".env",
		"../.env",
		"backend/.env",
	)
}

func requiredPositiveInt(name string) (int, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return 0, fmt.Errorf("%s is required", name)
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", name)
	}

	return value, nil
}

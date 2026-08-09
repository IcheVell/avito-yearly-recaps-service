package logger

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"strconv"
	"strings"
)

const defaultService = "avito-yearly-recaps-backend"

type Config struct {
	Level     string
	Format    string
	Service   string
	AddSource bool
	Output    io.Writer
}

func NewFromEnv() (*slog.Logger, error) {
	addSource, err := parseBoolEnv("LOG_ADD_SOURCE", os.Getenv("LOG_ADD_SOURCE"))
	if err != nil {
		return nil, err
	}

	return New(Config{
		Level:     os.Getenv("LOG_LEVEL"),
		Format:    os.Getenv("LOG_FORMAT"),
		Service:   os.Getenv("SERVICE_NAME"),
		AddSource: addSource,
	})
}

func New(cfg Config) (*slog.Logger, error) {
	level, err := parseLevel(cfg.Level)
	if err != nil {
		return nil, err
	}

	format, err := parseFormat(cfg.Format)
	if err != nil {
		return nil, err
	}

	output := cfg.Output
	if output == nil {
		output = os.Stdout
	}

	opts := &slog.HandlerOptions{
		Level:     level,
		AddSource: cfg.AddSource,
	}

	var handler slog.Handler
	switch format {
	case "json":
		handler = slog.NewJSONHandler(output, opts)
	case "text":
		handler = slog.NewTextHandler(output, opts)
	default:
		return nil, fmt.Errorf("unsupported log format %q", cfg.Format)
	}

	service := strings.TrimSpace(cfg.Service)
	if service == "" {
		service = defaultService
	}

	return slog.New(handler).With("service", service), nil
}

func NewDiscard() *slog.Logger {
	logger, err := New(Config{
		Format:  "text",
		Service: "test",
		Output:  io.Discard,
	})
	if err != nil {
		panic(err)
	}

	return logger
}

func SetDefault(logger *slog.Logger) {
	slog.SetDefault(OrDefault(logger))
}

func OrDefault(logger *slog.Logger) *slog.Logger {
	if logger == nil {
		return slog.Default()
	}

	return logger
}

func WithComponent(logger *slog.Logger, component string) *slog.Logger {
	logger = OrDefault(logger)

	component = strings.TrimSpace(component)
	if component == "" {
		return logger
	}

	return logger.With("component", component)
}

func parseLevel(raw string) (slog.Level, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "info":
		return slog.LevelInfo, nil
	case "debug":
		return slog.LevelDebug, nil
	case "warn", "warning":
		return slog.LevelWarn, nil
	case "error":
		return slog.LevelError, nil
	default:
		return 0, fmt.Errorf("unsupported log level %q", raw)
	}
}

func parseFormat(raw string) (string, error) {
	format := strings.ToLower(strings.TrimSpace(raw))
	switch format {
	case "", "json":
		return "json", nil
	case "text":
		return "text", nil
	default:
		return "", fmt.Errorf("unsupported log format %q", raw)
	}
}

func parseBoolEnv(name string, raw string) (bool, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return false, nil
	}

	value, err := strconv.ParseBool(raw)
	if err != nil {
		return false, fmt.Errorf("%s must be boolean: %w", name, err)
	}

	return value, nil
}

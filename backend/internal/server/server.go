package server

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"v1/internal/config"
	applog "v1/internal/logger"

	"gorm.io/gorm"
)

const defaultAddr = ":8080"

func Run(cfg config.Config, db *gorm.DB, logger *slog.Logger) error {
	srv := New(cfg, db, logger)
	serverLogger := applog.WithComponent(logger, "server")

	serverLogger.Info("http server started", "addr", srv.Addr, "operation", "start_http_server")
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		serverLogger.Error("http server failed", "err", err)
		return err
	}

	return nil
}

func New(cfg config.Config, db *gorm.DB, logger *slog.Logger) *http.Server {
	return &http.Server{
		Addr:              defaultAddr,
		Handler:           newRouter(cfg, db, logger),
		ReadHeaderTimeout: 5 * time.Second,
	}
}

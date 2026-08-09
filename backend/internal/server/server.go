package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	applog "v1/internal/logger"
)

const defaultAddr = ":8080"
const shutdownTimeout = 10 * time.Second

func Run(ctx context.Context, handler http.Handler, logger *slog.Logger) error {
	srv := New(handler)
	serverLogger := applog.WithComponent(logger, "server")
	errCh := start(srv, serverLogger)

	select {
	case err := <-errCh:
		return handleServerError(err, serverLogger, "start_http_server")
	case <-ctx.Done():
		return shutdown(srv, errCh, serverLogger)
	}
}

func New(handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              defaultAddr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func start(srv *http.Server, logger *slog.Logger) <-chan error {
	errCh := make(chan error, 1)
	go func() {
		logger.Info("http server started", "addr", srv.Addr, "operation", "start_http_server")
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}

		errCh <- nil
	}()

	return errCh
}

func shutdown(srv *http.Server, errCh <-chan error, logger *slog.Logger) error {
	logger.Info("http server shutdown started", "operation", "shutdown_http_server")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("http server shutdown failed", "err", err, "operation", "shutdown_http_server")
		return err
	}

	if err := handleServerError(<-errCh, logger, "shutdown_http_server"); err != nil {
		return err
	}

	logger.Info("http server stopped", "operation", "shutdown_http_server")

	return nil
}

func handleServerError(err error, logger *slog.Logger, operation string) error {
	if err != nil {
		logger.Error("http server failed", "err", err, "operation", operation)
		return err
	}

	return nil
}

package api

import (
	"log/slog"
	"net/http"
	"v1/internal/api/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Dependencies struct {
	Profiles handlers.ProfileProvider
	Recaps   handlers.RecapService
	Logger   *slog.Logger
}

func NewRouter(deps Dependencies) http.Handler {
	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}

	profilesHandler := handlers.NewProfilesHandler(deps.Profiles, logger)
	recapsHandler := handlers.NewRecapsHandler(deps.Recaps, logger)
	healthHandler := handlers.NewHealthHandler()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", healthHandler.Check)
		r.Get("/profiles", profilesHandler.List)
		r.Post("/recaps/generate", recapsHandler.Generate)
		r.Get("/recaps/{recapId}", recapsHandler.Get)
	})

	return r
}

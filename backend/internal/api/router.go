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

	r.Get("/health", healthHandler.Check)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/profiles", profilesHandler.List)
		r.Post("/profiles/{profile_id}/recaps", recapsHandler.Generate)
		r.Get("/profiles/{profile_id}/recaps", recapsHandler.GetByProfile)
		r.Get("/recaps/{recap_id}/share", recapsHandler.GetShare)
	})

	return r
}

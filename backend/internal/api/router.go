package api

import (
	"log/slog"
	"net/http"
	"time"
	"v1/internal/api/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Dependencies struct {
	Profiles     handlers.ProfileProvider
	Recaps       handlers.RecapService
	Achievements handlers.AchievementProvider
	Stats        handlers.StatsProvider
	CurrentYear  int
	Logger       *slog.Logger
}

func NewRouter(deps Dependencies) http.Handler {
	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}

	currentYear := deps.CurrentYear
	if currentYear == 0 {
		currentYear = time.Now().Year()
	}

	profilesHandler := handlers.NewProfilesHandler(deps.Profiles, currentYear, logger)
	recapsHandler := handlers.NewRecapsHandler(deps.Recaps, deps.Achievements, deps.Stats, currentYear, logger)
	healthHandler := handlers.NewHealthHandler()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", healthHandler.Check)
		r.Get("/profiles", profilesHandler.List)
		r.Post("/recaps/generate", recapsHandler.Generate)
		r.Get("/users/{userId}/recap", recapsHandler.GetUserRecap)
		r.Get("/users/{userId}/achievements", recapsHandler.ListAchievements)
		r.Get("/users/{userId}/stats", recapsHandler.GetStats)
	})

	return r
}

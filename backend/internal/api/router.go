package api

import (
	"log/slog"
	"net/http"
	"v1/internal/api/handlers"
	apimiddleware "v1/internal/api/middleware"
	applog "v1/internal/logger"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

type Dependencies struct {
	Profiles     handlers.ProfileProvider
	Recaps       handlers.RecapService
	ShareRecaps  handlers.ShareRecapService
	Achievements handlers.AchievementProvider
	Stats        handlers.StatsProvider
	Fortunes     handlers.FortuneProvider
	CurrentYear  int
	Logger       *slog.Logger
}

func NewRouter(deps Dependencies) http.Handler {
	logger := applog.OrDefault(deps.Logger)

	if deps.CurrentYear <= 0 {
		panic("api current year is required")
	}

	profilesHandler := handlers.NewProfilesHandler(deps.Profiles, deps.CurrentYear, logger)
	recapsHandler := handlers.NewRecapsHandler(deps.Recaps, deps.Achievements, deps.Stats, deps.CurrentYear, logger)
	shareRecapsHandler := handlers.NewShareRecapsHandler(deps.ShareRecaps, deps.CurrentYear, logger)
	fortunesHandler := handlers.NewFortunesHandler(deps.Fortunes, deps.CurrentYear, logger)
	healthHandler := handlers.NewHealthHandler()

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(apimiddleware.RequestLogger(applog.WithComponent(logger, "http")))

	fileServer := http.FileServer(http.Dir("./static"))

	r.Handle("/static/*", http.StripPrefix("/static/", fileServer))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", healthHandler.Check)
		r.Get("/profiles", profilesHandler.List)
		r.Post("/recaps/generate", recapsHandler.Generate)
		r.Get("/users/{userId}/recap", recapsHandler.GetUserRecap)
		r.Post("/users/{userId}/recap/share", shareRecapsHandler.CreateShare)
		r.Get("/share/{token}", shareRecapsHandler.GetShare)
		r.Get("/users/{userId}/achievements", recapsHandler.ListAchievements)
		r.Get("/users/{userId}/stats", recapsHandler.GetStats)
		r.Get("/users/{userId}/prediction", fortunesHandler.GetUserPrediction)
	})

	return r
}

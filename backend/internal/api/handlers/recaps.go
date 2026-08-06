package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"v1/internal/api/dto"
	"v1/internal/domain"
)

type RecapService interface {
	GenerateRecap(ctx context.Context, userID int64, year int) (domain.Recap, bool, error)
	GetUserRecap(ctx context.Context, userID int64, year int) (domain.Recap, error)
}

type AchievementProvider interface {
	ListUserAchievements(ctx context.Context, userID int64) ([]domain.YearlyRecapAchievement, error)
}

type StatsProvider interface {
	GetUserStats(ctx context.Context, userID int64, year int) (domain.YearMetrics, error)
}

type RecapsHandler struct {
	recaps       RecapService
	achievements AchievementProvider
	stats        StatsProvider
	currentYear  int
	logger       *slog.Logger
}

func NewRecapsHandler(
	recaps RecapService,
	achievements AchievementProvider,
	stats StatsProvider,
	currentYear int,
	logger *slog.Logger,
) *RecapsHandler {
	if logger == nil {
		logger = slog.Default()
	}

	return &RecapsHandler{
		recaps:       recaps,
		achievements: achievements,
		stats:        stats,
		currentYear:  currentYear,
		logger:       logger.With("component", "recaps_handler"),
	}
}

func (h *RecapsHandler) Generate(w http.ResponseWriter, r *http.Request) {
	if h.recaps == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	var req dto.GenerateRecapRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if req.UserID <= 0 {
		writeValidationError(w, "userId must be a positive integer", map[string]string{"field": "userId"})
		return
	}

	recap, created, err := h.recaps.GenerateRecap(r.Context(), req.UserID, h.currentYear)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"generate recap failed",
				"user_id", req.UserID,
				"year", h.currentYear,
				"err", err,
				"operation", "generate_recap",
			)
		}
		writeServiceError(w, err)
		return
	}

	status := http.StatusOK
	if created {
		status = http.StatusCreated
	}

	writeJSON(w, status, dto.NewRecapResponse(recap))
}

func (h *RecapsHandler) GetUserRecap(w http.ResponseWriter, r *http.Request) {
	if h.recaps == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	userID, ok := parsePositiveInt64PathParam(w, r, "userId")
	if !ok {
		return
	}

	recap, err := h.recaps.GetUserRecap(r.Context(), userID, h.currentYear)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"get recap failed",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "get_user_recap",
			)
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewRecapResponse(recap))
}

func (h *RecapsHandler) ListAchievements(w http.ResponseWriter, r *http.Request) {
	if h.achievements == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	userID, ok := parsePositiveInt64PathParam(w, r, "userId")
	if !ok {
		return
	}

	achievements, err := h.achievements.ListUserAchievements(r.Context(), userID)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"list achievements failed",
				"user_id", userID,
				"err", err,
				"operation", "list_user_achievements",
			)
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewUserAchievementsResponse(achievements))
}

func (h *RecapsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	if h.stats == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	userID, ok := parsePositiveInt64PathParam(w, r, "userId")
	if !ok {
		return
	}

	stats, err := h.stats.GetUserStats(r.Context(), userID, h.currentYear)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"get stats failed",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "get_user_stats",
			)
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewYearMetricsResponse(stats))
}

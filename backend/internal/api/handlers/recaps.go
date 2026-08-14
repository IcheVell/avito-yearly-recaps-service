package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"v1/internal/api/dto"
	"v1/internal/domain/entity"
	"v1/internal/domain/recap"
	applog "v1/internal/logger"
)

type RecapService interface {
	GenerateRecap(ctx context.Context, userID int64, year int) (recap.Recap, bool, error)
	GetUserRecap(ctx context.Context, userID int64, year int) (recap.Recap, error)
}

type AchievementProvider interface {
	ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, []*recap.AchievementEvaluation, error)
}

type StatsProvider interface {
	GetUserStats(ctx context.Context, userID int64, year int) (recap.YearMetrics, error)
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
	return &RecapsHandler{
		recaps:       recaps,
		achievements: achievements,
		stats:        stats,
		currentYear:  currentYear,
		logger:       applog.WithComponent(logger, "recaps_handler"),
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

	h.logger.InfoContext(
		r.Context(),
		"generate recap request",
		"user_id", req.UserID,
		"year", h.currentYear,
		"operation", "generate_recap",
	)

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
		} else {
			h.logger.WarnContext(
				r.Context(),
				"generate recap rejected",
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

	h.logger.InfoContext(
		r.Context(),
		"generate recap response",
		"user_id", req.UserID,
		"year", h.currentYear,
		"recap_id", recap.ID,
		"created", created,
		"status", status,
		"operation", "generate_recap",
	)

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

	h.logger.InfoContext(
		r.Context(),
		"get user recap request",
		"user_id", userID,
		"year", h.currentYear,
		"operation", "get_user_recap",
	)

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
		} else {
			h.logger.WarnContext(
				r.Context(),
				"get recap rejected",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "get_user_recap",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get user recap response",
		"user_id", userID,
		"year", h.currentYear,
		"recap_id", recap.ID,
		"operation", "get_user_recap",
	)

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

	h.logger.InfoContext(
		r.Context(),
		"list achievements request",
		"user_id", userID,
		"operation", "list_user_achievements",
	)

	earned, locked, rules, err := h.achievements.ListUserAchievements(r.Context(), userID)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"list achievements failed",
				"user_id", userID,
				"err", err,
				"operation", "list_user_achievements",
			)
		} else {
			h.logger.WarnContext(
				r.Context(),
				"list achievements rejected",
				"user_id", userID,
				"err", err,
				"operation", "list_user_achievements",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"list achievements response",
		"user_id", userID,
		"earned_count", len(earned),
		"locked_count", len(locked),
		"operation", "list_user_achievements",
	)

	writeJSON(w, http.StatusOK, dto.NewUserAchievementsResponse(earned, locked, rules))
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

	h.logger.InfoContext(
		r.Context(),
		"get stats request",
		"user_id", userID,
		"year", h.currentYear,
		"operation", "get_user_stats",
	)

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
		} else {
			h.logger.WarnContext(
				r.Context(),
				"get stats rejected",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "get_user_stats",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get stats response",
		"user_id", userID,
		"year", h.currentYear,
		"buys_count", stats.BuysCount,
		"sells_count", stats.SellsCount,
		"operation", "get_user_stats",
	)

	writeJSON(w, http.StatusOK, dto.NewYearMetricsResponse(stats))
}

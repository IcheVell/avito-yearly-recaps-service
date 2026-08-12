package handlers

import (
	"context"
	"log/slog"
	"net/http"

	"v1/internal/api/dto"
	"v1/internal/domain/fortune"
	applog "v1/internal/logger"
)

type FortuneProvider interface {
	GetUserFortune(ctx context.Context, userID int64, currentYear int) (fortune.Fortune, error)
}

type FortunesHandler struct {
	fortunes    FortuneProvider
	currentYear int
	logger      *slog.Logger
}

func NewFortunesHandler(fortunes FortuneProvider, currentYear int, logger *slog.Logger) *FortunesHandler {
	return &FortunesHandler{
		fortunes:    fortunes,
		currentYear: currentYear,
		logger:      applog.WithComponent(logger, "fortunes_handler"),
	}
}

func (h *FortunesHandler) GetUserPrediction(w http.ResponseWriter, r *http.Request) {
	if h.fortunes == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	userID, ok := parsePositiveInt64PathParam(w, r, "userId")
	if !ok {
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get fortune request",
		"user_id", userID,
		"year", h.currentYear+1,
		"operation", "get_fortune",
	)

	fortune, err := h.fortunes.GetUserFortune(r.Context(), userID, h.currentYear)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"get fortune failed",
				"user_id", userID,
				"year", h.currentYear+1,
				"err", err,
				"operation", "get_fortune",
			)
		} else {
			h.logger.WarnContext(
				r.Context(),
				"get fortune rejected",
				"user_id", userID,
				"year", h.currentYear+1,
				"err", err,
				"operation", "get_fortune",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get fortune response",
		"user_id", userID,
		"year", fortune.Year,
		"type", fortune.Type,
		"operation", "get_fortune",
	)

	writeJSON(w, http.StatusOK, dto.NewPredictionResponse(fortune))
}

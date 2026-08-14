package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"v1/internal/api/dto"
	"v1/internal/domain/recap"
	applog "v1/internal/logger"

	"github.com/go-chi/chi/v5"
)

type ShareRecapService interface {
	GenerateShareRecap(ctx context.Context, userID int64, year int) (string, error)
	GetShareRecapByToken(ctx context.Context, token string) (*recap.ShareRecap, error)
}

type ShareRecapsHandler struct {
	shares      ShareRecapService
	currentYear int
	logger      *slog.Logger
}

func NewShareRecapsHandler(
	shares ShareRecapService,
	currentYear int,
	logger *slog.Logger,
) *ShareRecapsHandler {
	return &ShareRecapsHandler{
		shares:      shares,
		currentYear: currentYear,
		logger:      applog.WithComponent(logger, "share_recaps_handler"),
	}
}

func (h *ShareRecapsHandler) CreateShare(w http.ResponseWriter, r *http.Request) {
	if h.shares == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	userID, ok := parsePositiveInt64PathParam(w, r, "userId")
	if !ok {
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"create share recap request",
		"user_id", userID,
		"year", h.currentYear,
		"operation", "create_share_recap",
	)

	shareURL, err := h.shares.GenerateShareRecap(r.Context(), userID, h.currentYear)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"create share recap failed",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "create_share_recap",
			)
		} else {
			h.logger.WarnContext(
				r.Context(),
				"create share recap rejected",
				"user_id", userID,
				"year", h.currentYear,
				"err", err,
				"operation", "create_share_recap",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"create share recap response",
		"user_id", userID,
		"year", h.currentYear,
		"share_url", shareURL,
		"operation", "create_share_recap",
	)

	writeJSON(w, http.StatusCreated, dto.NewCreateShareRecapResponse(shareURL))
}

func (h *ShareRecapsHandler) GetShare(w http.ResponseWriter, r *http.Request) {
	if h.shares == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	token := strings.TrimSpace(chi.URLParam(r, "token"))
	if token == "" {
		writeValidationError(w, "token is required", map[string]string{"field": "token"})
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get share recap request",
		"operation", "get_share_recap",
	)

	share, err := h.shares.GetShareRecapByToken(r.Context(), token)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(
				r.Context(),
				"get share recap failed",
				"err", err,
				"operation", "get_share_recap",
			)
		} else {
			h.logger.WarnContext(
				r.Context(),
				"get share recap rejected",
				"err", err,
				"operation", "get_share_recap",
			)
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"get share recap response",
		"year", share.Year,
		"operation", "get_share_recap",
	)

	writeJSON(w, http.StatusOK, dto.NewShareRecapResponse(*share))
}

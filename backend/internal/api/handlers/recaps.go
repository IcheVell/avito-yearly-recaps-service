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
	GetRecap(ctx context.Context, recapID int64) (domain.Recap, error)
}

type RecapsHandler struct {
	recaps RecapService
	logger *slog.Logger
}

func NewRecapsHandler(recaps RecapService, logger *slog.Logger) *RecapsHandler {
	if logger == nil {
		logger = slog.Default()
	}

	return &RecapsHandler{
		recaps: recaps,
		logger: logger.With("component", "recaps_handler"),
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
		writeValidationError(w, "userId must be positive", map[string]string{"field": "userId"})
		return
	}

	if !validYear(req.Year) {
		writeValidationError(w, "year must be between 2000 and current year", map[string]string{"field": "year"})
		return
	}

	recap, created, err := h.recaps.GenerateRecap(r.Context(), req.UserID, req.Year)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "generate recap failed", "user_id", req.UserID, "err", err, "operation", "generate_recap")
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

func (h *RecapsHandler) Get(w http.ResponseWriter, r *http.Request) {
	if h.recaps == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	recapID, ok := parsePositiveInt64PathParam(w, r, "recapId")
	if !ok {
		return
	}

	recap, err := h.recaps.GetRecap(r.Context(), recapID)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "get recap failed", "recap_id", recapID, "err", err, "operation", "get_recap")
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewRecapResponse(recap))
}

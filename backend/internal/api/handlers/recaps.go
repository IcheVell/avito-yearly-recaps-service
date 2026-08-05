package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"v1/internal/api/dto"
	"v1/internal/domain"
)

type RecapService interface {
	GenerateRecap(ctx context.Context, profileID int64, year int) (domain.Recap, bool, error)
	GetRecapByProfile(ctx context.Context, profileID int64, year int) (domain.Recap, error)
	GetShareRecap(ctx context.Context, recapID int64) (domain.Recap, error)
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

	profileID, ok := parsePositiveInt64PathParam(w, r, "profile_id")
	if !ok {
		return
	}

	var req dto.GenerateRecapRequest
	if !decodeJSONBody(w, r, &req) {
		return
	}

	if !validYear(req.Year) {
		writeValidationError(w, "year must be between 2000 and current year", map[string]string{"field": "year"})
		return
	}

	recap, created, err := h.recaps.GenerateRecap(r.Context(), profileID, req.Year)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "generate recap failed", "profile_id", profileID, "err", err, "operation", "generate_recap")
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

func (h *RecapsHandler) GetByProfile(w http.ResponseWriter, r *http.Request) {
	if h.recaps == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	profileID, ok := parsePositiveInt64PathParam(w, r, "profile_id")
	if !ok {
		return
	}

	year, ok := parseOptionalYearQuery(w, r)
	if !ok {
		return
	}

	recap, err := h.recaps.GetRecapByProfile(r.Context(), profileID, year)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "get recap by profile failed", "profile_id", profileID, "err", err, "operation", "get_recap_by_profile")
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewRecapResponse(recap))
}

func (h *RecapsHandler) GetShare(w http.ResponseWriter, r *http.Request) {
	if h.recaps == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	recapID, ok := parsePositiveInt64PathParam(w, r, "recap_id")
	if !ok {
		return
	}

	recap, err := h.recaps.GetShareRecap(r.Context(), recapID)
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "get share recap failed", "recap_id", recapID, "err", err, "operation", "get_share_recap")
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewRecapResponse(recap))
}

package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"v1/internal/api/dto"
	"v1/internal/domain/entity"
	applog "v1/internal/logger"
)

type ProfileProvider interface {
	ListProfiles(ctx context.Context) ([]entity.User, error)
}

type ProfilesHandler struct {
	profiles    ProfileProvider
	currentYear int
	logger      *slog.Logger
}

func NewProfilesHandler(profiles ProfileProvider, currentYear int, logger *slog.Logger) *ProfilesHandler {
	return &ProfilesHandler{
		profiles:    profiles,
		currentYear: currentYear,
		logger:      applog.WithComponent(logger, "profiles_handler"),
	}
}

func (h *ProfilesHandler) List(w http.ResponseWriter, r *http.Request) {
	if h.profiles == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	h.logger.InfoContext(r.Context(), "list profiles request", "operation", "list_profiles")

	profiles, err := h.profiles.ListProfiles(r.Context())
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "list profiles failed", "err", err, "operation", "list_profiles")
		} else {
			h.logger.WarnContext(r.Context(), "list profiles rejected", "err", err, "operation", "list_profiles")
		}
		writeServiceError(w, err)
		return
	}

	h.logger.InfoContext(
		r.Context(),
		"list profiles response",
		"count", len(profiles),
		"current_year", h.currentYear,
		"operation", "list_profiles",
	)

	writeJSON(w, http.StatusOK, dto.NewProfilesResponse(profiles, h.currentYear))
}

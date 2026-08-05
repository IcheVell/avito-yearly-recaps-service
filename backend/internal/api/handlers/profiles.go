package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"v1/internal/api/dto"
	"v1/internal/domain"
)

type ProfileProvider interface {
	ListProfiles(ctx context.Context) ([]domain.User, error)
}

type ProfilesHandler struct {
	profiles ProfileProvider
	logger   *slog.Logger
}

func NewProfilesHandler(profiles ProfileProvider, logger *slog.Logger) *ProfilesHandler {
	if logger == nil {
		logger = slog.Default()
	}

	return &ProfilesHandler{
		profiles: profiles,
		logger:   logger.With("component", "profiles_handler"),
	}
}

func (h *ProfilesHandler) List(w http.ResponseWriter, r *http.Request) {
	if h.profiles == nil {
		writeError(w, http.StatusInternalServerError, errorCodeInternal, "internal error", nil)
		return
	}

	profiles, err := h.profiles.ListProfiles(r.Context())
	if err != nil {
		if shouldLogServiceError(err) {
			h.logger.ErrorContext(r.Context(), "list profiles failed", "err", err, "operation", "list_profiles")
		}
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.NewProfilesResponse(profiles))
}

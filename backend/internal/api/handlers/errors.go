package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

const (
	errorCodeValidation = "VALIDATION_ERROR"
	errorCodeNotFound   = "NOT_FOUND"
	errorCodeConflict   = "CONFLICT"
	errorCodeInternal   = "INTERNAL_ERROR"
)

type errorResponse struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

type statusCoder interface {
	StatusCode() int
}

type errorCoder interface {
	ErrorCode() string
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeValidationError(w http.ResponseWriter, message string, details map[string]string) {
	writeError(w, http.StatusBadRequest, errorCodeValidation, message, details)
}

func writeServiceError(w http.ResponseWriter, err error) {
	status := serviceErrorStatus(err)
	code := errorCodeInternal
	message := "internal error"

	if status < http.StatusInternalServerError {
		code = codeByStatus(status)
		message = err.Error()
	}

	var ec errorCoder
	if errors.As(err, &ec) && ec.ErrorCode() != "" {
		code = ec.ErrorCode()
	}

	writeError(w, status, code, message, nil)
}

func shouldLogServiceError(err error) bool {
	return serviceErrorStatus(err) >= http.StatusInternalServerError
}

func serviceErrorStatus(err error) int {
	status := http.StatusInternalServerError

	var sc statusCoder
	if errors.As(err, &sc) {
		status = sc.StatusCode()
	}

	if status < http.StatusBadRequest || status > 599 {
		return http.StatusInternalServerError
	}

	return status
}

func writeError(w http.ResponseWriter, status int, code, message string, details map[string]string) {
	writeJSON(w, status, errorResponse{
		Error: errorBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func decodeJSONBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		writeValidationError(w, "invalid json body", nil)
		return false
	}

	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeValidationError(w, "request body must contain a single json object", nil)
		return false
	}

	return true
}

func parsePositiveInt64PathParam(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	raw := chi.URLParam(r, name)
	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		writeValidationError(w, "invalid path parameter", map[string]string{"field": name})
		return 0, false
	}

	return value, true
}

func parseOptionalYearQuery(w http.ResponseWriter, r *http.Request) (int, bool) {
	raw := r.URL.Query().Get("year")
	if raw == "" {
		return 0, true
	}

	year, err := strconv.Atoi(raw)
	if err != nil {
		writeValidationError(w, "invalid query parameter", map[string]string{"field": "year"})
		return 0, false
	}

	if !validYear(year) {
		writeValidationError(w, "year must be between 2000 and current year", map[string]string{"field": "year"})
		return 0, false
	}

	return year, true
}

func validYear(year int) bool {
	currentYear := time.Now().Year()
	return year >= 2000 && year <= currentYear
}

func codeByStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return errorCodeValidation
	case http.StatusNotFound:
		return errorCodeNotFound
	case http.StatusConflict:
		return errorCodeConflict
	default:
		return errorCodeInternal
	}
}

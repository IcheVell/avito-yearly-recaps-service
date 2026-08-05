package api_test

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"v1/internal/api"
	"v1/internal/api/dto"
	"v1/internal/domain"
)

type fakeProfiles struct {
	users []domain.User
	err   error
}

func (f fakeProfiles) ListProfiles(ctx context.Context) ([]domain.User, error) {
	return f.users, f.err
}

type fakeRecaps struct {
	recap   domain.Recap
	created bool

	generateProfileID int64
	generateYear      int
	generateErr       error

	getProfileID int64
	getYear      int
	getErr       error

	shareID  int64
	shareErr error
}

func (f *fakeRecaps) GenerateRecap(ctx context.Context, profileID int64, year int) (domain.Recap, bool, error) {
	f.generateProfileID = profileID
	f.generateYear = year
	return f.recap, f.created, f.generateErr
}

func (f *fakeRecaps) GetRecapByProfile(ctx context.Context, profileID int64, year int) (domain.Recap, error) {
	f.getProfileID = profileID
	f.getYear = year
	return f.recap, f.getErr
}

func (f *fakeRecaps) GetShareRecap(ctx context.Context, recapID int64) (domain.Recap, error) {
	f.shareID = recapID
	return f.recap, f.shareErr
}

type testHTTPError struct {
	status int
	code   string
	msg    string
}

func (e testHTTPError) Error() string {
	return e.msg
}

func (e testHTTPError) StatusCode() int {
	return e.status
}

func (e testHTTPError) ErrorCode() string {
	return e.code
}

func TestRouter(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		target     string
		body       string
		profiles   fakeProfiles
		recaps     *fakeRecaps
		wantStatus int
		assert     func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps)
	}{
		{
			name:       "health ok",
			method:     http.MethodGet,
			target:     "/health",
			profiles:   fakeProfiles{},
			recaps:     nil,
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				var response struct {
					Status string `json:"status"`
				}
				decodeResponse(t, rr, &response)

				if response.Status != "ok" {
					t.Fatalf("status body = %q, want ok", response.Status)
				}
			},
		},
		{
			name:   "list profiles",
			method: http.MethodGet,
			target: "/api/v1/profiles",
			profiles: fakeProfiles{
				users: []domain.User{
					{ID: 1, Username: "seller_anna", ImageURL: "https://example.com/anna.png"},
					{ID: 2, Username: "buyer_igor", ImageURL: "https://example.com/igor.png"},
				},
			},
			recaps:     nil,
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				var response dto.ProfilesResponse
				decodeResponse(t, rr, &response)

				if len(response.Items) != 2 {
					t.Fatalf("items len = %d, want 2", len(response.Items))
				}
				if response.Items[0].Username != "seller_anna" {
					t.Fatalf("first username = %q, want seller_anna", response.Items[0].Username)
				}
				if response.Items[0].ImageURL == "" {
					t.Fatal("first imageUrl is empty")
				}
			},
		},
		{
			name:       "generate recap created",
			method:     http.MethodPost,
			target:     "/api/v1/profiles/1/recaps",
			body:       `{"year":2025}`,
			profiles:   fakeProfiles{},
			recaps:     &fakeRecaps{recap: sampleRecap(), created: true},
			wantStatus: http.StatusCreated,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				if recaps.generateProfileID != 1 {
					t.Fatalf("profileID = %d, want 1", recaps.generateProfileID)
				}
				if recaps.generateYear != 2025 {
					t.Fatalf("year = %d, want 2025", recaps.generateYear)
				}

				var response dto.RecapResponse
				decodeResponse(t, rr, &response)

				if response.ProfileID != 1 {
					t.Fatalf("profile_id = %d, want 1", response.ProfileID)
				}

				wantTypes := []string{
					"intro",
					"number",
					"number",
					"text",
					"comparison",
					"role",
					"achievements",
					"recommendation",
				}
				assertCardTypes(t, response.Cards, wantTypes)

				if response.Cards[7].Action != "raise_listing" {
					t.Fatalf("recommendation action = %q, want raise_listing", response.Cards[7].Action)
				}
			},
		},
		{
			name:       "generate recap invalid profile id",
			method:     http.MethodPost,
			target:     "/api/v1/profiles/abc/recaps",
			body:       `{"year":2025}`,
			profiles:   fakeProfiles{},
			recaps:     &fakeRecaps{},
			wantStatus: http.StatusBadRequest,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				assertValidationError(t, rr, "profile_id")
			},
		},
		{
			name:       "generate recap invalid year",
			method:     http.MethodPost,
			target:     "/api/v1/profiles/1/recaps",
			body:       `{"year":1999}`,
			profiles:   fakeProfiles{},
			recaps:     &fakeRecaps{},
			wantStatus: http.StatusBadRequest,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				assertValidationError(t, rr, "year")
			},
		},
		{
			name:       "get recap by profile passes year query",
			method:     http.MethodGet,
			target:     "/api/v1/profiles/1/recaps?year=2025",
			profiles:   fakeProfiles{},
			recaps:     &fakeRecaps{recap: sampleRecap()},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				if recaps.getProfileID != 1 {
					t.Fatalf("profileID = %d, want 1", recaps.getProfileID)
				}
				if recaps.getYear != 2025 {
					t.Fatalf("year = %d, want 2025", recaps.getYear)
				}
			},
		},
		{
			name:     "share recap maps service not found",
			method:   http.MethodGet,
			target:   "/api/v1/recaps/404/share",
			profiles: fakeProfiles{},
			recaps: &fakeRecaps{
				shareErr: testHTTPError{
					status: http.StatusNotFound,
					code:   "RECAP_NOT_FOUND",
					msg:    "recap not found",
				},
			},
			wantStatus: http.StatusNotFound,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps) {
				var response struct {
					Error struct {
						Code    string `json:"code"`
						Message string `json:"message"`
					} `json:"error"`
				}
				decodeResponse(t, rr, &response)

				if response.Error.Code != "RECAP_NOT_FOUND" {
					t.Fatalf("error code = %q, want RECAP_NOT_FOUND", response.Error.Code)
				}
				if response.Error.Message != "recap not found" {
					t.Fatalf("error message = %q, want recap not found", response.Error.Message)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newTestRouter(tt.profiles, tt.recaps)

			req := httptest.NewRequest(tt.method, tt.target, strings.NewReader(tt.body))
			rr := httptest.NewRecorder()

			router.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rr.Code, tt.wantStatus)
			}

			if tt.assert != nil {
				tt.assert(t, rr, tt.recaps)
			}
		})
	}
}

func newTestRouter(profiles fakeProfiles, recaps *fakeRecaps) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return api.NewRouter(api.Dependencies{
		Profiles: profiles,
		Recaps:   recaps,
		Logger:   logger,
	})
}

func sampleRecap() domain.Recap {
	return domain.Recap{
		ID:     10,
		UserID: 1,
		Year:   2025,
		Metrics: []domain.RecapMetric{
			{
				Type:    "earned_amount",
				Title:   "Ты заработал за год",
				Text:    "Ты заработал за год",
				Payload: map[string]any{"earnedAmount": 120000},
			},
			{
				Type:    "active_days",
				Title:   "Дней активности",
				Text:    "Дней активности",
				Payload: map[string]any{"activeDays": 120},
			},
			{
				Type:  "favorite_category",
				Title: "Любимая категория",
				Text:  "Твоя любимая категория - Авто",
			},
			{
				Type:  "comparison",
				Title: "Сравнение",
				Text:  "Ты активнее 80% пользователей",
			},
		},
		Role: domain.RecapRole{
			Code:  "seller",
			Title: "Продавец года",
		},
		Achievements: []domain.RecapAchievement{
			{Name: "Чистая продажа"},
			{Name: "Мастер переговоров"},
		},
		Action: domain.RecapAction{
			Type:   "raise_listing",
			Label:  "Подними объявление",
			Reason: "Подними своё объявление",
		},
	}
}

func decodeResponse(t *testing.T, rr *httptest.ResponseRecorder, dst any) {
	t.Helper()

	if err := json.NewDecoder(rr.Body).Decode(dst); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

func assertCardTypes(t *testing.T, cards []dto.RecapCard, wantTypes []string) {
	t.Helper()

	if len(cards) != len(wantTypes) {
		t.Fatalf("cards len = %d, want %d", len(cards), len(wantTypes))
	}
	for i, wantType := range wantTypes {
		if cards[i].Type != wantType {
			t.Fatalf("cards[%d].type = %q, want %q", i, cards[i].Type, wantType)
		}
	}
}

func assertValidationError(t *testing.T, rr *httptest.ResponseRecorder, field string) {
	t.Helper()

	var response struct {
		Error struct {
			Code    string            `json:"code"`
			Details map[string]string `json:"details"`
		} `json:"error"`
	}
	decodeResponse(t, rr, &response)

	if response.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("error code = %q, want VALIDATION_ERROR", response.Error.Code)
	}
	if response.Error.Details["field"] != field {
		t.Fatalf("field = %q, want %q", response.Error.Details["field"], field)
	}
}

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
	"time"
	"v1/internal/api"
	"v1/internal/api/dto"
	"v1/internal/domain/entity"
	domainfortune "v1/internal/domain/fortune"
	"v1/internal/domain/recap"
	applog "v1/internal/logger"
)

const testCurrentYear = 2026

type fakeProfiles struct {
	users []entity.User
	err   error
}

func (f fakeProfiles) ListProfiles(ctx context.Context) ([]entity.User, error) {
	return f.users, f.err
}

type fakeRecaps struct {
	recap   recap.Recap
	created bool

	generateUserID int64
	generateYear   int
	generateErr    error

	getUserID int64
	getYear   int
	getErr    error
}

func (f *fakeRecaps) GenerateRecap(ctx context.Context, userID int64, year int) (recap.Recap, bool, error) {
	f.generateUserID = userID
	f.generateYear = year
	return f.recap, f.created, f.generateErr
}

func (f *fakeRecaps) GetUserRecap(ctx context.Context, userID int64, year int) (recap.Recap, error) {
	f.getUserID = userID
	f.getYear = year
	return f.recap, f.getErr
}

type fakeAchievements struct {
	userID      int64
	earned      []entity.UserAchievement
	locked      []entity.Achievement
	evaluations []*recap.AchievementEvaluation
	err         error
}

func (f *fakeAchievements) ListUserAchievements(ctx context.Context, userID int64) ([]entity.UserAchievement, []entity.Achievement, []*recap.AchievementEvaluation, error) {
	f.userID = userID
	return f.earned, f.locked, f.evaluations, f.err
}

type fakeStats struct {
	userID  int64
	year    int
	metrics recap.YearMetrics
	err     error
}

func (f *fakeStats) GetUserStats(ctx context.Context, userID int64, year int) (recap.YearMetrics, error) {
	f.userID = userID
	f.year = year
	return f.metrics, f.err
}

type fakeFortunes struct {
	userID      int64
	currentYear int
	fortune     domainfortune.Fortune
	err         error
}

func (f *fakeFortunes) GetUserFortune(ctx context.Context, userID int64, currentYear int) (domainfortune.Fortune, error) {
	f.userID = userID
	f.currentYear = currentYear
	return f.fortune, f.err
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
		name         string
		method       string
		target       string
		body         string
		profiles     fakeProfiles
		recaps       *fakeRecaps
		achievements *fakeAchievements
		stats        *fakeStats
		wantStatus   int
		assert       func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats)
	}{
		{
			name:       "health ok",
			method:     http.MethodGet,
			target:     "/api/health",
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
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
			target: "/api/profiles",
			profiles: fakeProfiles{
				users: []entity.User{
					{ID: 1, Username: "seller_anna", ImageURL: "https://example.com/anna.png"},
					{ID: 2, Username: "buyer_igor", ImageURL: "https://example.com/igor.png"},
				},
			},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				var response dto.ProfilesResponse
				decodeResponse(t, rr, &response)

				if response.CurrentYear != testCurrentYear {
					t.Fatalf("currentYear = %d, want %d", response.CurrentYear, testCurrentYear)
				}
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
			target:     "/api/recaps/generate",
			body:       `{"userId":1}`,
			recaps:     &fakeRecaps{recap: sampleRecap(), created: true},
			wantStatus: http.StatusCreated,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				if recaps.generateUserID != 1 {
					t.Fatalf("userID = %d, want 1", recaps.generateUserID)
				}
				if recaps.generateYear != testCurrentYear {
					t.Fatalf("year = %d, want %d", recaps.generateYear, testCurrentYear)
				}

				var response dto.RecapResponse
				decodeResponse(t, rr, &response)

				if response.UserID != 1 {
					t.Fatalf("userId = %d, want 1", response.UserID)
				}
				if response.Role.Code != "seller" {
					t.Fatalf("role.code = %q, want seller", response.Role.Code)
				}
				if len(response.Metrics) != 1 {
					t.Fatalf("metrics len = %d, want 1", len(response.Metrics))
				}
				if response.Metrics[0].Payload["earnedAmount"] == nil {
					t.Fatal("metric payload must contain earnedAmount")
				}
				if response.Action.Target.ListingIDs[0] != 11 {
					t.Fatalf("action target listing id = %d, want 11", response.Action.Target.ListingIDs[0])
				}
			},
		},
		{
			name:       "generate recap ignores frontend year",
			method:     http.MethodPost,
			target:     "/api/recaps/generate",
			body:       `{"userId":1,"year":2025}`,
			recaps:     &fakeRecaps{recap: sampleRecap()},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				if recaps.generateYear != testCurrentYear {
					t.Fatalf("year = %d, want %d", recaps.generateYear, testCurrentYear)
				}
			},
		},
		{
			name:       "generate recap invalid user id",
			method:     http.MethodPost,
			target:     "/api/recaps/generate",
			body:       `{"userId":0}`,
			recaps:     &fakeRecaps{},
			wantStatus: http.StatusBadRequest,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				assertValidationField(t, rr, "userId")
			},
		},
		{
			name:       "get user recap",
			method:     http.MethodGet,
			target:     "/api/users/1/recap",
			recaps:     &fakeRecaps{recap: sampleRecap()},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				if recaps.getUserID != 1 {
					t.Fatalf("userID = %d, want 1", recaps.getUserID)
				}
				if recaps.getYear != testCurrentYear {
					t.Fatalf("year = %d, want %d", recaps.getYear, testCurrentYear)
				}
			},
		},
		{
			name:   "get user recap maps service not found",
			method: http.MethodGet,
			target: "/api/users/1/recap",
			recaps: &fakeRecaps{
				getErr: testHTTPError{
					status: http.StatusNotFound,
					code:   "RECAP_NOT_FOUND",
					msg:    "recap not found",
				},
			},
			wantStatus: http.StatusNotFound,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				assertErrorCode(t, rr, "RECAP_NOT_FOUND")
			},
		},
		{
			name:   "list user achievements",
			method: http.MethodGet,
			target: "/api/users/1/achievements",
			achievements: &fakeAchievements{
				earned: []entity.UserAchievement{
					{
						CreatedAt: time.Date(2023, 10, 5, 12, 0, 0, 0, time.UTC),
						Achievement: entity.Achievement{
							Code:        "plot_twist",
							Name:        "Неожиданный поворот",
							Description: "После паузы ты вернулся на площадку.",
							ImageURL:    "https://images.example.test/achievements/plot-twist.png",
						},
					},
					{
						CreatedAt: time.Date(2025, 8, 12, 0, 0, 0, 0, time.UTC),
						Achievement: entity.Achievement{
							Code:        "streak_survivor",
							Name:        "Несгибаемый",
							Description: "Серия без пропусков.",
							ImageURL:    "https://images.example.test/achievements/streak-survivor.png",
						},
					},
				},
				locked: []entity.Achievement{
					{
						Code:        "diplomat",
						Name:        "Дипломат",
						Description: "Кажется ты перепутал Avito с мессенджером.",
						ImageURL:    "https://images.example.test/achievements/diplomat.png",
					},
				},
			},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				if achievements.userID != 1 {
					t.Fatalf("userID = %d, want 1", achievements.userID)
				}

				var response dto.UserAchievementsResponse
				decodeResponse(t, rr, &response)

				if len(response.Earned) != 2 {
					t.Fatalf("earned len = %d, want 2", len(response.Earned))
				}
				if response.Earned[0].Code != "streak_survivor" {
					t.Fatalf("first earned = %q, want streak_survivor", response.Earned[0].Code)
				}
				if response.Earned[0].ImageURL == "" {
					t.Fatal("earned imageUrl is empty")
				}
				if len(response.Locked) != 1 {
					t.Fatalf("locked len = %d, want 1", len(response.Locked))
				}
				if response.Locked[0].Code != "diplomat" {
					t.Fatalf("locked = %q, want diplomat", response.Locked[0].Code)
				}
				if response.Locked[0].ImageURL == "" {
					t.Fatal("locked imageUrl is empty")
				}
			},
		},
		{
			name:       "get user stats",
			method:     http.MethodGet,
			target:     "/api/users/1/stats",
			stats:      &fakeStats{metrics: sampleYearMetrics()},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				if stats.userID != 1 {
					t.Fatalf("userID = %d, want 1", stats.userID)
				}
				if stats.year != testCurrentYear {
					t.Fatalf("year = %d, want %d", stats.year, testCurrentYear)
				}

				var response dto.YearMetricsResponse
				decodeResponse(t, rr, &response)

				if response.UserID != 1 {
					t.Fatalf("userId = %d, want 1", response.UserID)
				}
				if response.FavoriteBuyCategory == nil || response.FavoriteBuyCategory.Name != "Электроника" {
					t.Fatalf("favoriteBuyCategory = %#v, want Электроника", response.FavoriteBuyCategory)
				}
				if response.MessagedListingIDs[0] != 9 {
					t.Fatalf("messagedListingIds[0] = %d, want 9", response.MessagedListingIDs[0])
				}
			},
		},
		{
			name:       "user route invalid user id",
			method:     http.MethodGet,
			target:     "/api/users/0/recap",
			recaps:     &fakeRecaps{},
			wantStatus: http.StatusBadRequest,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, recaps *fakeRecaps, achievements *fakeAchievements, stats *fakeStats) {
				assertValidationField(t, rr, "userId")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newTestRouter(tt.profiles, tt.recaps, tt.achievements, tt.stats)

			req := httptest.NewRequest(tt.method, tt.target, strings.NewReader(tt.body))
			rr := httptest.NewRecorder()

			router.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rr.Code, tt.wantStatus)
			}

			if tt.assert != nil {
				tt.assert(t, rr, tt.recaps, tt.achievements, tt.stats)
			}
		})
	}
}

func TestRouterPrediction(t *testing.T) {
	tests := []struct {
		name       string
		target     string
		fortunes   *fakeFortunes
		wantStatus int
		assert     func(t *testing.T, rr *httptest.ResponseRecorder, fortunes *fakeFortunes)
	}{
		{
			name:   "get user prediction",
			target: "/api/users/1/prediction",
			fortunes: &fakeFortunes{
				fortune: domainfortune.Fortune{
					UserID: 1,
					Year:   2027,
					Title:  "Твоё предсказание на 2027",
					Text:   "В следующем году на Avito тебя ждёт редкая находка.",
					Type:   domainfortune.TypeFortune,
				},
			},
			wantStatus: http.StatusOK,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, fortunes *fakeFortunes) {
				if fortunes.userID != 1 {
					t.Fatalf("userID = %d, want 1", fortunes.userID)
				}
				if fortunes.currentYear != testCurrentYear {
					t.Fatalf("currentYear = %d, want %d", fortunes.currentYear, testCurrentYear)
				}

				var response dto.PredictionResponse
				decodeResponse(t, rr, &response)

				if response.UserID != 1 {
					t.Fatalf("userId = %d, want 1", response.UserID)
				}
				if response.Year != 2027 {
					t.Fatalf("year = %d, want 2027", response.Year)
				}
				if response.Title != "Твоё предсказание на 2027" {
					t.Fatalf("title = %q, want year title", response.Title)
				}
				if response.Text == "" {
					t.Fatal("text is empty")
				}
				if response.Type != domainfortune.TypeFortune {
					t.Fatalf("type = %q, want %q", response.Type, domainfortune.TypeFortune)
				}
			},
		},
		{
			name:       "invalid user id",
			target:     "/api/users/0/prediction",
			fortunes:   &fakeFortunes{},
			wantStatus: http.StatusBadRequest,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, fortunes *fakeFortunes) {
				assertValidationField(t, rr, "userId")
			},
		},
		{
			name:   "maps service error",
			target: "/api/users/1/prediction",
			fortunes: &fakeFortunes{
				err: testHTTPError{
					status: http.StatusNotFound,
					code:   "USER_NOT_FOUND",
					msg:    "user not found",
				},
			},
			wantStatus: http.StatusNotFound,
			assert: func(t *testing.T, rr *httptest.ResponseRecorder, fortunes *fakeFortunes) {
				assertErrorCode(t, rr, "USER_NOT_FOUND")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := api.NewRouter(api.Dependencies{
				Fortunes:    tt.fortunes,
				CurrentYear: testCurrentYear,
				Logger:      applog.NewDiscard(),
			})

			req := httptest.NewRequest(http.MethodGet, tt.target, nil)
			rr := httptest.NewRecorder()

			router.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rr.Code, tt.wantStatus)
			}

			if tt.assert != nil {
				tt.assert(t, rr, tt.fortunes)
			}
		})
	}
}

func TestNewRouterRequiresCurrentYear(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("NewRouter must panic when current year is not configured")
		}
	}()

	_ = api.NewRouter(api.Dependencies{
		Profiles: fakeProfiles{},
		Logger:   slog.New(slog.NewTextHandler(io.Discard, nil)),
	})
}

func newTestRouter(
	profiles fakeProfiles,
	recaps *fakeRecaps,
	achievements *fakeAchievements,
	stats *fakeStats,
) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return api.NewRouter(api.Dependencies{
		Profiles:     profiles,
		Recaps:       recaps,
		Achievements: achievements,
		Stats:        stats,
		CurrentYear:  testCurrentYear,
		Logger:       logger,
	})
}

func sampleRecap() recap.Recap {
	return recap.Recap{
		ID:        10,
		UserID:    1,
		Year:      2026,
		CreatedAt: time.Date(2026, 1, 15, 12, 0, 0, 0, time.UTC),
		Metrics: []recap.RecapMetric{
			{
				Type:       "earned_amount",
				Title:      "Твои продажи",
				Text:       "Твои объявления отработали как подработка: 120 000 ₽ за год.",
				Highlights: []string{"120 000 ₽"},
				Payload:    map[string]any{"earnedAmount": 120000},
			},
		},
		Role: recap.RecapRole{
			Code:                 "seller",
			Title:                "В этом году ты крутой продавец!",
			Subtitle:             "Ты продал 9 товаров.",
			Why:                  "67% активности — создание объявлений и продажа товаров",
			ActivitySharePercent: 67,
		},
		Achievements: []recap.RecapAchievement{
			{
				Code:        "clean_sale",
				Name:        "Чистая продажа",
				Description: "У тебя есть завершённые продажи в этом году.",
			},
		},
		Action: recap.RecapAction{
			Type:   "boost_listings",
			Label:  "Обновить объявления",
			Reason: "Есть активные объявления с низким откликом.",
			Target: recap.RecapActionTarget{
				ListingIDs: []int64{11},
				CategoryID: 3,
			},
		},
		Debug: recap.RecapDebug{
			GeneratorVersion: "v1",
			SeedProfile:      "seller_1",
		},
	}
}

func sampleYearMetrics() recap.YearMetrics {
	spentAmount := int64(48000)
	earnedAmount := int64(120000)
	priceMin := int64(500)
	priceMax := int64(150000)
	sellerRating := 4.9

	return recap.YearMetrics{
		UserID:               1,
		RegistrationDate:     time.Date(2025, 6, 1, 12, 0, 0, 0, time.UTC),
		ViewsCount:           847,
		SearchesCount:        120,
		FavoritesCount:       15,
		MessagesPeopleCount:  37,
		ListingsCreatedCount: 8,
		BuysCount:            4,
		SellsCount:           9,
		SpentAmount:          &spentAmount,
		EarnedAmount:         &earnedAmount,
		MaxStreakDays:        14,
		ActiveDays:           120,
		YearsOnAvito:         6,
		PriceMin:             &priceMin,
		PriceMax:             &priceMax,
		SellerRating:         &sellerRating,
		FavoriteBuyCategory:  &recap.YearMetricsCategory{ID: 1, Name: "Электроника"},
		FavoriteSellCategory: &recap.YearMetricsCategory{ID: 3, Name: "Одежда и обувь"},
		MostViewedListing:    &recap.YearMetricsListing{ID: 2, Name: "iPhone 13 128GB", City: "Москва", ImageURL: "https://example.com/image.png", ViewsCount: 42},
		BestReviewReceived:   &recap.YearMetricsReview{ID: 5, Rating: 5, Text: "Всё четко, рекомендую"},
		BestReviewLeft:       &recap.YearMetricsReview{ID: 6, Rating: 5, Text: "Товар как в описании"},
		ViewsByCategory:      []recap.YearMetricsViews{{CategoryID: 1, CategoryName: "Электроника", Views: 400}},
		SearchesByCategory:   []recap.YearMetricsSearches{{CategoryID: 1, CategoryName: "Электроника", Searches: 80}},
		Favorites:            []recap.YearMetricsFavorite{{ListingID: 2, CategoryID: 1}},
		ListingViewCounts:    []recap.YearMetricsListingCount{{ListingID: 2, CategoryID: 1, Views: 42}},
		MessagedListingIDs:   []int64{9},
		OwnListings:          []recap.YearMetricsOwnListing{{ID: 11, CategoryID: 3, Status: "active", UpdatedAt: time.Date(2025, 6, 1, 12, 0, 0, 0, time.UTC), ViewsCount: 3}},
	}
}

func decodeResponse(t *testing.T, rr *httptest.ResponseRecorder, dst any) {
	t.Helper()

	if err := json.NewDecoder(rr.Body).Decode(dst); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

func assertErrorCode(t *testing.T, rr *httptest.ResponseRecorder, code string) {
	t.Helper()

	var response struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	decodeResponse(t, rr, &response)

	if response.Error.Code != code {
		t.Fatalf("error code = %q, want %s", response.Error.Code, code)
	}
}

func assertValidationField(t *testing.T, rr *httptest.ResponseRecorder, field string) {
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

package service

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"testing"

	"v1/internal/domain/entity"
	"v1/internal/domain/fortune"
	applog "v1/internal/logger"
	"v1/internal/repository"
)

type fakeFortuneGenerator struct {
	text string
	err  error
	year int
}

func (f *fakeFortuneGenerator) Generate(ctx context.Context, year int) (string, error) {
	f.year = year
	return f.text, f.err
}

func TestFortuneService_GetUserFortune(t *testing.T) {
	tests := []struct {
		name          string
		generator     *fakeFortuneGenerator
		wantText      string
		wantFallback  bool
		wantGenerated bool
	}{
		{
			name:          "ai generator returns fortune",
			generator:     &fakeFortuneGenerator{text: "В следующем году на Avito тебя ждёт редкая находка."},
			wantText:      "В следующем году на Avito тебя ждёт редкая находка.",
			wantGenerated: true,
		},
		{
			name:         "ai generator error uses fallback",
			generator:    &fakeFortuneGenerator{err: errors.New("ai unavailable")},
			wantFallback: true,
		},
		{
			name:         "ai generator empty text uses fallback",
			generator:    &fakeFortuneGenerator{text: "  "},
			wantFallback: true,
		},
		{
			name:         "ai generator invalid text uses fallback",
			generator:    &fakeFortuneGenerator{text: "В следующем году ты заработаешь 1000 ₽."},
			wantFallback: true,
		},
		{
			name:         "nil generator uses fallback",
			wantFallback: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var generator FortuneGenerator
			if tt.generator != nil {
				generator = tt.generator
			}

			svc := NewFortuneService(fakeFortuneUsers{user: testFortuneUser()}, generator, testFortuneLogger())

			got, err := svc.GetUserFortune(context.Background(), 910001, 2026)
			if err != nil {
				t.Fatalf("GetUserFortune() error = %v", err)
			}

			if got.UserID != 910001 {
				t.Fatalf("UserID = %d, want 910001", got.UserID)
			}
			if got.Year != 2027 {
				t.Fatalf("Year = %d, want 2027", got.Year)
			}
			if got.Title != "Твоё предсказание на 2027" {
				t.Fatalf("Title = %q, want year title", got.Title)
			}
			if tt.wantFallback {
				if !isFallbackFortune(got.Text) {
					t.Fatalf("Text = %q, want fallback fortune", got.Text)
				}
			} else if got.Text != tt.wantText {
				t.Fatalf("Text = %q, want %q", got.Text, tt.wantText)
			}
			if got.Type != fortune.TypeFortune {
				t.Fatalf("Type = %q, want %q", got.Type, fortune.TypeFortune)
			}
			if tt.wantGenerated && tt.generator.year != 2027 {
				t.Fatalf("generator year = %d, want 2027", tt.generator.year)
			}
		})
	}
}

func TestFortuneService_UserNotFound(t *testing.T) {
	svc := NewFortuneService(
		fakeFortuneUsers{err: repository.ErrUserNotFound},
		&fakeFortuneGenerator{text: "В следующем году на Avito тебя ждёт редкая находка."},
		testFortuneLogger(),
	)

	_, err := svc.GetUserFortune(context.Background(), 1, 2026)
	var httpErr HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("error type = %T, want HTTPError", err)
	}
	if httpErr.StatusCode() != http.StatusNotFound || httpErr.ErrorCode() != "USER_NOT_FOUND" {
		t.Fatalf("http error = status:%d code:%q, want 404 USER_NOT_FOUND", httpErr.StatusCode(), httpErr.ErrorCode())
	}
}

func TestNormalizeFortuneText(t *testing.T) {
	got := normalizeFortuneText(" «В следующем году тебя ждёт удачная находка.» ")
	want := "В следующем году тебя ждёт удачная находка."
	if got != want {
		t.Fatalf("normalizeFortuneText() = %q, want %q", got, want)
	}
}

func TestNormalizeFortuneText_BrandName(t *testing.T) {
	got := normalizeFortuneText("В следующем году на Avито тебя ждёт редкая находка.")
	want := "В следующем году на Avito тебя ждёт редкая находка."
	if got != want {
		t.Fatalf("normalizeFortuneText() = %q, want %q", got, want)
	}
}

func isFallbackFortune(text string) bool {
	for _, fallback := range fallbackFortunes {
		if text == fallback {
			return true
		}
	}

	return false
}

func testFortuneLogger() *slog.Logger {
	return applog.NewDiscard()
}

type fakeFortuneUsers struct {
	user *entity.User
	err  error
}

func (f fakeFortuneUsers) GetByID(ctx context.Context, id int64) (*entity.User, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.user == nil || f.user.ID != id {
		return nil, repository.ErrUserNotFound
	}

	return f.user, nil
}

func (f fakeFortuneUsers) ListProfiles(ctx context.Context) ([]entity.User, error) {
	if f.user == nil {
		return nil, nil
	}

	return []entity.User{*f.user}, nil
}

func testFortuneUser() *entity.User {
	return &entity.User{ID: 910001, Username: "aferist_alina"}
}

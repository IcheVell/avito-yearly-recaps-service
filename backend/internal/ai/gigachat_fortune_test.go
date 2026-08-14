package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestGigaChatFortuneGenerator_Generate(t *testing.T) {
	authCalls := 0
	authServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authCalls++

		if r.Method != http.MethodPost {
			t.Fatalf("auth method = %s, want POST", r.Method)
		}
		if r.Header.Get("Authorization") != "Basic test-auth-key" {
			t.Fatalf("auth Authorization header = %q, want basic key", r.Header.Get("Authorization"))
		}
		if r.Header.Get("RqUID") == "" {
			t.Fatal("auth RqUID header is empty")
		}
		if err := r.ParseForm(); err != nil {
			t.Fatalf("parse auth form: %v", err)
		}
		if r.Form.Get("scope") != "GIGACHAT_API_PERS" {
			t.Fatalf("scope = %q, want GIGACHAT_API_PERS", r.Form.Get("scope"))
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(gigaChatAuthResponse{
			AccessToken: "access-token",
			ExpiresAt:   time.Now().Add(time.Hour).Unix(),
		})
	}))
	defer authServer.Close()

	chatCalls := 0
	chatServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		chatCalls++

		if r.Method != http.MethodPost {
			t.Fatalf("chat method = %s, want POST", r.Method)
		}
		if r.URL.Path != "/v1/chat/completions" {
			t.Fatalf("chat path = %q, want /v1/chat/completions", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer access-token" {
			t.Fatalf("chat Authorization header = %q, want bearer token", r.Header.Get("Authorization"))
		}

		var request gigaChatCompletionRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode chat request: %v", err)
		}
		if request.Model != "GigaChat-2" {
			t.Fatalf("model = %q, want GigaChat-2", request.Model)
		}
		if request.Temperature != 1.0 {
			t.Fatalf("temperature = %v, want 1.0", request.Temperature)
		}
		if request.TopP != 0.95 {
			t.Fatalf("topP = %v, want 0.95", request.TopP)
		}
		if len(request.Messages) != 2 {
			t.Fatalf("messages len = %d, want 2", len(request.Messages))
		}
		if !strings.Contains(request.Messages[1].Content, "2027") {
			t.Fatalf("user prompt = %q, want year", request.Messages[1].Content)
		}
		for _, want := range []string{"Тема:", "Тон:", "Образ:"} {
			if !strings.Contains(request.Messages[1].Content, want) {
				t.Fatalf("user prompt = %q, want %q", request.Messages[1].Content, want)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"choices":[{"message":{"role":"assistant","content":"В следующем году на Avito тебя ждёт редкая находка."}}]}`))
	}))
	defer chatServer.Close()

	generator := NewGigaChatFortuneGenerator(GigaChatConfig{
		AuthKey: "test-auth-key",
		APIURL:  chatServer.URL,
		AuthURL: authServer.URL,
	})

	for i := 0; i < 2; i++ {
		got, err := generator.Generate(context.Background(), 2027)
		if err != nil {
			t.Fatalf("Generate() error = %v", err)
		}

		want := "В следующем году на Avito тебя ждёт редкая находка."
		if got != want {
			t.Fatalf("Generate() = %q, want %q", got, want)
		}
	}

	if authCalls != 1 {
		t.Fatalf("auth calls = %d, want 1", authCalls)
	}
	if chatCalls != 2 {
		t.Fatalf("chat calls = %d, want 2", chatCalls)
	}
}

func TestGigaChatFortuneGenerator_DisabledWithoutAuthKey(t *testing.T) {
	generator := NewGigaChatFortuneGenerator(GigaChatConfig{})

	if _, err := generator.Generate(context.Background(), 2027); err == nil {
		t.Fatal("Generate() error = nil, want error")
	}
}

func TestAuthorizationHeader(t *testing.T) {
	tests := []struct {
		name    string
		authKey string
		want    string
	}{
		{
			name:    "empty",
			authKey: "",
			want:    "",
		},
		{
			name:    "authorization key",
			authKey: "YWJjZA==",
			want:    "Basic YWJjZA==",
		},
		{
			name:    "authorization key without padding",
			authKey: "YWJjZA",
			want:    "Basic YWJjZA==",
		},
		{
			name:    "basic prefix",
			authKey: "Basic YWJjZA==",
			want:    "Basic YWJjZA==",
		},
		{
			name:    "client credentials",
			authKey: "client-id:client-secret",
			want:    "Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := authorizationHeader(tt.authKey); got != tt.want {
				t.Fatalf("authorizationHeader() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestTokenExpiry(t *testing.T) {
	seconds := int64(1781694805)
	if got := tokenExpiry(seconds); got.Unix() != seconds {
		t.Fatalf("tokenExpiry(seconds).Unix() = %d, want %d", got.Unix(), seconds)
	}

	milliseconds := seconds * 1000
	if got := tokenExpiry(milliseconds); got.UnixMilli() != milliseconds {
		t.Fatalf("tokenExpiry(milliseconds).UnixMilli() = %d, want %d", got.UnixMilli(), milliseconds)
	}
}

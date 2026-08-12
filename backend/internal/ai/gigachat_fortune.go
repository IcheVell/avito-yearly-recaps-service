package ai

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	mathrand "math/rand/v2"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	DefaultGigaChatModel = "GigaChat-2"
	DefaultGigaChatScope = "GIGACHAT_API_PERS"

	defaultGigaChatAPIURL  = "https://api.giga.chat"
	defaultGigaChatAuthURL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
	defaultGigaChatTimeout = 3 * time.Second
)

type GigaChatConfig struct {
	AuthKey            string
	Scope              string
	Model              string
	APIURL             string
	AuthURL            string
	Timeout            time.Duration
	HTTPClient         *http.Client
	InsecureSkipVerify bool
}

type Config struct {
	APIKey             string
	Scope              string
	Model              string
	APIURL             string
	AuthURL            string
	Timeout            time.Duration
	HTTPClient         *http.Client
	InsecureSkipVerify bool
}

func NewFortuneGenerator(cfg Config) *GigaChatFortuneGenerator {
	return NewGigaChatFortuneGenerator(GigaChatConfig{
		AuthKey:            cfg.APIKey,
		Scope:              cfg.Scope,
		Model:              cfg.Model,
		APIURL:             cfg.APIURL,
		AuthURL:            cfg.AuthURL,
		Timeout:            cfg.Timeout,
		HTTPClient:         cfg.HTTPClient,
		InsecureSkipVerify: cfg.InsecureSkipVerify,
	})
}

type GigaChatFortuneGenerator struct {
	authHeader string
	scope      string
	model      string
	apiURL     string
	authURL    string
	timeout    time.Duration
	client     *http.Client

	mu          sync.Mutex
	accessToken string
	expiresAt   time.Time
}

func NewGigaChatFortuneGenerator(cfg GigaChatConfig) *GigaChatFortuneGenerator {
	scope := strings.TrimSpace(cfg.Scope)
	if scope == "" {
		scope = DefaultGigaChatScope
	}

	model := strings.TrimSpace(cfg.Model)
	if model == "" {
		model = DefaultGigaChatModel
	}

	apiURL := strings.TrimRight(strings.TrimSpace(cfg.APIURL), "/")
	if apiURL == "" {
		apiURL = defaultGigaChatAPIURL
	}

	authURL := strings.TrimSpace(cfg.AuthURL)
	if authURL == "" {
		authURL = defaultGigaChatAuthURL
	}

	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = defaultGigaChatTimeout
	}

	client := cfg.HTTPClient
	if client == nil {
		client = &http.Client{
			Timeout:   timeout,
			Transport: transport(cfg.InsecureSkipVerify),
		}
	}

	return &GigaChatFortuneGenerator{
		authHeader: authorizationHeader(cfg.AuthKey),
		scope:      scope,
		model:      model,
		apiURL:     apiURL,
		authURL:    authURL,
		timeout:    timeout,
		client:     client,
	}
}

func transport(insecureSkipVerify bool) http.RoundTripper {
	if !insecureSkipVerify {
		return http.DefaultTransport
	}

	baseTransport, ok := http.DefaultTransport.(*http.Transport)
	if !ok {
		return http.DefaultTransport
	}

	cloned := baseTransport.Clone()
	cloned.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}

	return cloned
}

func (g *GigaChatFortuneGenerator) Generate(ctx context.Context, year int) (string, error) {
	if g == nil || g.authHeader == "" {
		return "", errors.New("ai fortune generator is disabled")
	}

	ctx, cancel := context.WithTimeout(ctx, g.timeout)
	defer cancel()

	token, err := g.token(ctx)
	if err != nil {
		return "", err
	}

	requestBody := gigaChatCompletionRequest{
		Model: g.model,
		Messages: []gigaChatMessage{
			{Role: "system", Content: fortunePrompt()},
			{Role: "user", Content: fortuneUserPrompt(year)},
		},
		MaxTokens:   80,
		Temperature: 1.0,
		TopP:        0.95,
	}

	payload, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("marshal ai request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.apiURL+"/v1/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("create ai request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := g.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("call ai chat completions: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", fmt.Errorf("ai chat completions status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var response gigaChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("decode ai response: %w", err)
	}

	text := strings.TrimSpace(response.text())
	if text == "" {
		return "", errors.New("ai response text is empty")
	}

	return text, nil
}

func (g *GigaChatFortuneGenerator) token(ctx context.Context) (string, error) {
	g.mu.Lock()
	if g.accessToken != "" && time.Now().Before(g.expiresAt.Add(-time.Minute)) {
		token := g.accessToken
		g.mu.Unlock()
		return token, nil
	}
	g.mu.Unlock()

	token, expiresAt, err := g.fetchToken(ctx)
	if err != nil {
		return "", err
	}

	g.mu.Lock()
	g.accessToken = token
	g.expiresAt = expiresAt
	g.mu.Unlock()

	return token, nil
}

func (g *GigaChatFortuneGenerator) fetchToken(ctx context.Context) (string, time.Time, error) {
	form := url.Values{}
	form.Set("scope", g.scope)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.authURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("create ai auth request: %w", err)
	}
	req.Header.Set("Authorization", g.authHeader)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("RqUID", requestID())

	resp, err := g.client.Do(req)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("call ai oauth: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", time.Time{}, fmt.Errorf("ai oauth status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var response gigaChatAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", time.Time{}, fmt.Errorf("decode ai oauth response: %w", err)
	}

	if strings.TrimSpace(response.AccessToken) == "" {
		return "", time.Time{}, errors.New("ai access token is empty")
	}

	return response.AccessToken, tokenExpiry(response.ExpiresAt), nil
}

func authorizationHeader(authKey string) string {
	credentials := strings.TrimSpace(authKey)
	if credentials == "" {
		return ""
	}

	if strings.HasPrefix(strings.ToLower(credentials), "basic ") {
		return credentials
	}

	if strings.Contains(credentials, ":") {
		credentials = base64.StdEncoding.EncodeToString([]byte(credentials))
	} else {
		credentials = paddedBase64(credentials)
	}

	return "Basic " + credentials
}

func paddedBase64(value string) string {
	switch len(value) % 4 {
	case 2:
		return value + "=="
	case 3:
		return value + "="
	default:
		return value
	}
}

type gigaChatAuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresAt   int64  `json:"expires_at"`
}

type gigaChatCompletionRequest struct {
	Model       string            `json:"model"`
	Messages    []gigaChatMessage `json:"messages"`
	MaxTokens   int               `json:"max_tokens,omitempty"`
	Temperature float64           `json:"temperature,omitempty"`
	TopP        float64           `json:"top_p,omitempty"`
}

type gigaChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type gigaChatCompletionResponse struct {
	Choices []gigaChatChoice `json:"choices"`
}

type gigaChatChoice struct {
	Message gigaChatMessage `json:"message"`
}

func (r gigaChatCompletionResponse) text() string {
	if len(r.Choices) == 0 {
		return ""
	}

	return r.Choices[0].Message.Content
}

func tokenExpiry(raw int64) time.Time {
	if raw <= 0 {
		return time.Now().Add(25 * time.Minute)
	}

	if raw > 1_000_000_000_000 {
		return time.UnixMilli(raw)
	}

	return time.Unix(raw, 0)
}

func requestID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}

	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func fortunePrompt() string {
	return `Ты генерируешь короткое предсказание для пользователя Avito на следующий год.
Это аналог печенья с предсказанием.
Требования:
- язык: русский;
- длина: максимум 1–2 коротких предложения;
- тон: позитивный, лёгкий и немного загадочный;
- предсказание должно быть связано с Avito;
- название сервиса пиши строго как Avito;
- допустимые темы: покупки, продажи, объявления, выгодные находки, редкие вещи, общение с покупателями или продавцами, расхламление, новое увлечение;
- не использовать реальные пользовательские метрики;
- не утверждать, что это настоящий прогноз;
- не давать финансовых обещаний;
- не делать предсказаний про здоровье, смерть, отношения или политику;
- не использовать негативные или пугающие сценарии;
- не использовать фантастические или невозможные предметы и события;
- не придумывать новые функции, разделы или изменения продукта Avito;
- не обещать конкретный заработок;
- не использовать персональные данные пользователя.
Верни только текст предсказания без Markdown и дополнительных комментариев.`
}

func fortuneUserPrompt(year int) string {
	return fmt.Sprintf(
		"Сгенерируй одно предсказание для пользователя Avito на %d год.\nТема: %s.\nТон: %s.\nОбраз: %s.\nСделай текст новым и не используй шаблонные формулировки.",
		year,
		randomChoice(fortuneThemes),
		randomChoice(fortuneTones),
		randomChoice(fortuneImages),
	)
}

func randomChoice(items []string) string {
	if len(items) == 0 {
		return ""
	}

	return items[mathrand.IntN(len(items))]
}

var fortuneThemes = []string{
	"выгодная находка",
	"быстрая продажа",
	"редкая вещь",
	"удачная переписка",
	"расхламление",
	"новое увлечение",
	"сезонная покупка",
	"вещь для дома",
	"неожиданная сделка",
	"объявление, которое заметят",
}

var fortuneTones = []string{
	"лёгкий и добрый",
	"немного загадочный",
	"с лёгким юмором",
	"как короткий совет",
	"как приятное предчувствие",
	"теплый и спокойный",
	"энергичный",
	"ироничный, но позитивный",
}

var fortuneImages = []string{
	"случайная находка в ленте",
	"сообщение от подходящего покупателя",
	"вещь, которую давно хотелось найти",
	"объявление, которое вовремя попалось на глаза",
	"удачное обновление старого объявления",
	"маленькая покупка, которая радует весь год",
	"коробка с вещами, которым пора найти нового владельца",
	"новое хобби, начавшееся с простой покупки",
}

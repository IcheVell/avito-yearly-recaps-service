package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"unicode/utf8"

	"v1/internal/domain/fortune"
	applog "v1/internal/logger"
)

const maxFortuneTextRunes = 240

var (
	errEmptyFortuneText   = errors.New("fortune text is empty")
	errInvalidFortuneText = errors.New("fortune text is invalid")

	fallbackFortunes = []string{
		"В следующем году тебя ждёт неожиданно выгодная находка. Главное — не пролистать её мимо.",
		"Одно из твоих объявлений найдёт покупателя быстрее, чем ты ожидаешь.",
		"Следующий год может принести тебе ту самую вещь, которую ты давно искал.",
		"Похоже, впереди год удачных находок и приятных сделок.",
		"В следующем году старое объявление может неожиданно открыть новую возможность.",
	}
)

type FortuneGenerator interface {
	Generate(ctx context.Context, year int) (string, error)
}

type FortuneService struct {
	users     UserRepository
	generator FortuneGenerator
	logger    *slog.Logger
}

func NewFortuneService(users UserRepository, generator FortuneGenerator, logger *slog.Logger) *FortuneService {
	return &FortuneService{
		users:     users,
		generator: generator,
		logger:    applog.WithComponent(logger, "fortune_service"),
	}
}

func (s *FortuneService) GetUserFortune(ctx context.Context, userID int64, currentYear int) (fortune.Fortune, error) {
	nextYear := currentYear + 1
	s.logger.InfoContext(ctx, "get fortune started", "user_id", userID, "year", nextYear, "operation", "get_fortune")

	if currentYear <= 0 {
		return fortune.Fortune{}, fmt.Errorf("current year is required")
	}

	if _, err := s.users.GetByID(ctx, userID); err != nil {
		s.logger.WarnContext(ctx, "get fortune user lookup failed", "user_id", userID, "err", err, "operation", "get_fortune")
		return fortune.Fortune{}, mapUserError(err)
	}

	text := s.generateFortuneText(ctx, userID, nextYear)
	result := fortune.Fortune{
		UserID: userID,
		Year:   nextYear,
		Title:  fmt.Sprintf("Твоё предсказание на %d", nextYear),
		Text:   text,
		Type:   fortune.TypeFortune,
	}

	s.logger.InfoContext(ctx, "get fortune succeeded", "user_id", userID, "year", nextYear, "operation", "get_fortune")

	return result, nil
}

func (s *FortuneService) generateFortuneText(ctx context.Context, userID int64, year int) string {
	if s.generator == nil {
		return fallbackFortune(userID, year)
	}

	text, err := s.generator.Generate(ctx, year)
	if err == nil {
		text = normalizeFortuneText(text)
		if isValidFortuneText(text) {
			return text
		}

		err = errInvalidFortuneText
		if text == "" {
			err = errEmptyFortuneText
		}
	}

	s.logger.WarnContext(
		ctx,
		"ai fortune generation failed, using fallback",
		"user_id", userID,
		"year", year,
		"err", err,
		"operation", "get_fortune",
	)

	return fallbackFortune(userID, year)
}

func normalizeFortuneText(text string) string {
	text = strings.Trim(strings.TrimSpace(text), "\"'`*«»")

	return strings.NewReplacer(
		"Авито", "Avito",
		"авито", "Avito",
		"Avито", "Avito",
		"avito", "Avito",
	).Replace(text)
}

func isValidFortuneText(text string) bool {
	return text != "" &&
		utf8.RuneCountInString(text) <= maxFortuneTextRunes &&
		!strings.ContainsAny(text, "\r\n") &&
		!hasForbiddenFortuneTopic(text)
}

func hasForbiddenFortuneTopic(text string) bool {
	lower := strings.ToLower(text)
	for _, forbidden := range []string{
		"здоров",
		"смерт",
		"отношен",
		"полит",
		"заработаешь",
		"доход",
		"прибыль",
		"₽",
		"руб",
	} {
		if strings.Contains(lower, forbidden) {
			return true
		}
	}

	return false
}

func fallbackFortune(userID int64, year int) string {
	if len(fallbackFortunes) == 0 {
		return "В следующем году тебя ждёт удачная находка на Avito."
	}

	index := int((userID + int64(year)) % int64(len(fallbackFortunes)))
	if index < 0 {
		index = -index
	}

	return fallbackFortunes[index]
}

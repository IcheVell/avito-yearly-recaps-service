package app

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"v1/internal/ai"
	"v1/internal/api"
	"v1/internal/config"
	applog "v1/internal/logger"
	"v1/internal/postgres"
	"v1/internal/repository"
	"v1/internal/server"
	"v1/internal/service"
)

func Run(ctx context.Context) error {
	config.LoadEnv()

	runCtx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger, err := applog.NewFromEnv()
	if err != nil {
		_, _ = os.Stderr.WriteString("logger init failed: " + err.Error() + "\n")
		return err
	}

	appLogger := applog.WithComponent(logger, "app")
	applog.SetDefault(logger)

	cfg, err := config.NewConfig()
	if err != nil {
		appLogger.Error("config load failed", "err", err)
		return err
	}

	startupCtx, cancel := context.WithTimeout(runCtx, 5*time.Second)
	defer cancel()

	db, err := postgres.New(startupCtx, cfg, logger)
	if err != nil {
		appLogger.Error("database connection failed", "err", err)
		return err
	}

	sqlDB, err := db.DB()
	if err != nil {
		appLogger.Error("database connection handle failed", "err", err)
		return err
	}
	defer func() {
		if err := sqlDB.Close(); err != nil {
			appLogger.Error("database close failed", "err", err, "operation", "close_database")
		}
	}()

	appLogger.Info("database connected", "operation", "connect_database")
	appLogger.Info(
		"recap year configured",
		"recap_year", cfg.RecapYear,
		"operation", "load_config",
	)

	userRepo := repository.NewUserRepository(db, logger)
	metricsRepo := repository.NewMetricsRepository(db, logger)
	recapRepo := repository.NewRecapRepository(db, logger)
	shareRecapRepo := repository.NewShareRecapRepository(db, logger)
	achievementsRepo := repository.NewAchievementsRepository(db, logger)
	userStatsRepo := repository.NewUserStatsRepository(db, logger)

	achievementsService := service.NewAchievementService(achievementsRepo, userRepo, userStatsRepo, logger)
	recapService := service.NewRecapService(userRepo, metricsRepo, recapRepo, achievementsService, logger)
	shareRecapService := service.NewShareRecapService(recapService, shareRecapRepo)
	fortuneService := service.NewFortuneService(userRepo, newFortuneGenerator(cfg), logger)

	handler := api.NewRouter(api.Dependencies{
		Profiles:     userRepo,
		Recaps:       recapService,
		ShareRecaps:  shareRecapService,
		Achievements: achievementsService,
		Stats:        recapService,
		Fortunes:     fortuneService,
		CurrentYear:  cfg.RecapYear,
		Logger:       logger,
	})

	if err := server.Run(runCtx, handler, logger); err != nil {
		return err
	}

	appLogger.Info("application stopped", "operation", "shutdown_application")

	return nil
}

func newFortuneGenerator(cfg config.Config) service.FortuneGenerator {
	if cfg.AIAPIKey == "" {
		return nil
	}

	timeout := time.Duration(cfg.AITimeoutMS) * time.Millisecond

	return ai.NewFortuneGenerator(ai.Config{
		APIKey:             cfg.AIAPIKey,
		Scope:              cfg.AIScope,
		Model:              cfg.AIModel,
		APIURL:             cfg.AIAPIURL,
		AuthURL:            cfg.AIAuthURL,
		Timeout:            timeout,
		InsecureSkipVerify: cfg.AIInsecureSkipVerify,
	})
}

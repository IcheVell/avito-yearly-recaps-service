package main

import (
	"context"
	"log"
	"time"
	"v1/internal/config"
	"v1/internal/postgres"
)

func main() {
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = postgres.New(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to psql")
}

package main

import (
	"context"
	"os"

	"v1/internal/app"
)

func main() {
	if err := app.Run(context.Background()); err != nil {
		os.Exit(1)
	}
}

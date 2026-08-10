package engine

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"sync"

	"v1/catalog"
	"v1/internal/domain/recap"
)

const (
	seller  = "seller"
	buyer   = "buyer"
	watcher = "watcher"

	weightListingCreated = 5
	weightSell           = 10
	weightFavorite       = 3
	weightBuy            = 10
	weightView           = 1
	weightSearch         = 1
)

func ResolveRole(metrics recap.YearMetrics) (recap.RecapRole, error) {
	role, percent := chooseCode(metrics)

	title, subtitle, why, name, err := chooseText(role, percent, metrics)
	if err != nil {
		return recap.RecapRole{}, err
	}

	return recap.RecapRole{
		Code:                 role,
		Name:                 name,
		Title:                title,
		Subtitle:             subtitle,
		Why:                  why,
		ActivitySharePercent: int(percent),
	}, nil
}

func chooseText(role string, percent int64, metrics recap.YearMetrics) (string, string, string, string, error) {
	roleStats, err := loadRoleCopies()
	if err != nil {
		return "", "", "", "", err
	}

	stats, ok := roleStats[role]
	if !ok {
		return "", "", "", "", errors.New("role does not exist in json file")
	}

	titlesNum := len(stats.Titles)
	if titlesNum == 0 {
		return "", "", "", "", errors.New("role has no titles")
	}

	randomIndex := rand.IntN(titlesNum)
	title := stats.Titles[randomIndex]

	var metric int64

	switch role {
	case seller:
		metric = metrics.SellsCount
	case buyer:
		metric = metrics.BuysCount
	case watcher:
		metric = metrics.ViewsCount
	}

	subtitle := fmt.Sprintf(stats.Subtitle, metric)
	why := fmt.Sprintf(stats.Why, percent)

	return title, subtitle, why, stats.Name, nil
}

func chooseCode(metrics recap.YearMetrics) (string, int64) {
	sellerScore := metrics.ListingsCreatedCount*weightListingCreated + metrics.SellsCount*weightSell
	buyerScore := metrics.FavoritesCount*weightFavorite + metrics.BuysCount*weightBuy
	watcherScore := metrics.ViewsCount*weightView + metrics.SearchesCount*weightSearch

	maxScore := max(sellerScore, buyerScore, watcherScore)

	if maxScore == 0 {
		return watcher, 100
	}

	sum := sellerScore + buyerScore + watcherScore

	switch maxScore {
	case sellerScore:
		return seller, (sellerScore * 100) / sum
	case buyerScore:
		return buyer, (buyerScore * 100) / sum
	}

	return watcher, (watcherScore * 100) / sum
}

type roleStats struct {
	Name     string   `json:"name"`
	Titles   []string `json:"titles"`
	Subtitle string   `json:"subtitle"`
	Why      string   `json:"why"`
}

var (
	roleCopies     map[string]roleStats
	roleCopiesErr  error
	roleCopiesOnce sync.Once
)

func loadRoleCopies() (map[string]roleStats, error) {
	roleCopiesOnce.Do(func() {
		roleCopiesErr = json.Unmarshal(catalog.RolesJSON, &roleCopies)
	})
	return roleCopies, roleCopiesErr
}

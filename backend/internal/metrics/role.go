package metrics

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"os"
	"v1/internal/domain"
)

const (
	seller  = "seller"
	buyer   = "buyer"
	watcher = "watcher"
)

func ResolveRole(metrics domain.YearMetrics, path string) (error, domain.RecapRole) {
	role, percent := choseCode(metrics)
	err, title, subtitle, why := choseText(role, percent, metrics, path)
	if err != nil {
		return err, domain.RecapRole{}
	}
	return nil, domain.RecapRole{
		Code:                 role,
		Title:                title,
		Subtitle:             subtitle,
		Why:                  why,
		ActivitySharePercent: percent,
	}
}

func choseText(role string, percent int, metrics domain.YearMetrics, path string) (error, string, string, string) {
	err, roleStats := getRoleStats(path)
	if err != nil {
		return err, "", "", ""
	}
	stats, exist := roleStats[role]
	if !exist {
		return errors.New("role does not exist in json file"), "", "", ""
	}
	titlesNum := len(stats.Titles)
	randomIndex := rand.IntN(titlesNum)
	title := stats.Titles[randomIndex]

	var metric int

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
	return nil, title, subtitle, why
}

func choseCode(metrics domain.YearMetrics) (string, int) {
	sellerScore := metrics.ListingsCreatedCount*5 + metrics.SellsCount*10
	buyerScore := metrics.FavoritesCount*3 + metrics.BuysCount*10
	watcherScore := metrics.ViewsCount + metrics.SearchesCount

	maxScore := max(sellerScore, buyerScore, watcherScore)

	if maxScore == 0 {
		return "", 100
	}

	sum := sellerScore + buyerScore + watcherScore

	if maxScore == sellerScore {
		return seller, int((float32(sellerScore) / float32(sum)) * 100)
	} else if maxScore == buyerScore {
		return buyer, int((float32(buyerScore) / float32(sum)) * 100)
	}

	return watcher, int((float32(watcherScore) / float32(sum)) * 100)
}

func getRoleStats(path string) (error, map[string]RoleStats) {
	file, err := os.Open(path)
	if err != nil {
		return err, nil
	}
	defer file.Close()

	var roles map[string]RoleStats
	err = json.NewDecoder(file).Decode(&roles)
	if err != nil {
		return err, nil
	}

	return nil, roles
}

type RoleStats struct {
	Titles   []string `json:"titles"`
	Subtitle string   `json:"subtitle"`
	Why      string   `json:"why"`
}

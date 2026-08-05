package engine

import (
	_ "embed"
	"encoding/json"
	"errors"
	"slices"
	"sort"
	"sync"
	"time"
	"v1/internal/domain"
)

const (
	openFavorites    = "open_favorites"
	continueSearch   = "continue_search"
	listingAbandoned = "listing_abandoned"
	boostListings    = "boost_listings"
	createListing    = "create_listing"
	compareTop       = "compare_top"

	minAbandonedViews           = 5
	minFavoriteCategoryListings = 5
	minFavoriteListings         = 10
	staleDays                   = 14
	lowViewsThreshold           = 5
)

func ResolveAction(metrics domain.YearMetrics, role string) (domain.RecapAction, error) {
	selected := chooseType(metrics, role)

	actionCopies, err := loadActionCopies()
	if err != nil {
		return domain.RecapAction{}, err
	}

	copyStat, ok := actionCopies[selected.Type]
	if !ok {
		return domain.RecapAction{}, errors.New("action type does not exist in json file")
	}

	return domain.RecapAction{
		Type:   selected.Type,
		Label:  copyStat.Label,
		Reason: copyStat.Reason,
		Target: domain.RecapActionTarget{
			ListingIDs: selected.ListingIDs,
			CategoryID: selected.CategoryID,
		},
	}, nil
}

type selectedAction struct {
	Type       string
	ListingIDs []int64
	CategoryID int64
}

func chooseType(metrics domain.YearMetrics, role string) selectedAction {
	if role == seller {
		if ids, ok := findStaleListingTargets(metrics, time.Now()); ok {
			return selectedAction{Type: boostListings, ListingIDs: ids}
		}
		if metrics.SellsCount > 0 {
			return selectedAction{Type: createListing}
		}
	}

	if listingID, categoryID, ok := findAbandonedListing(metrics); ok {
		return selectedAction{
			Type:       listingAbandoned,
			ListingIDs: []int64{listingID},
			CategoryID: categoryID,
		}
	}

	if categoryID, listingIDs, ok := findCompareTopTargets(metrics); ok {
		return selectedAction{
			Type:       compareTop,
			CategoryID: categoryID,
			ListingIDs: listingIDs, // top-3
		}
	}

	if categoryID, ok := findOpenFavoritesCategory(metrics); ok {
		return selectedAction{
			Type:       openFavorites,
			CategoryID: categoryID,
		}
	}

	return selectedAction{
		Type:       continueSearch,
		CategoryID: findContinueSearchCategory(metrics),
	}
}

func findStaleListingTargets(metrics domain.YearMetrics, now time.Time) ([]int64, bool) {
	var ids []int64
	cutoff := now.AddDate(0, 0, -staleDays)
	for _, l := range metrics.OwnListings {
		if l.Status != "active" {
			continue
		}
		if l.UpdatedAt.After(cutoff) {
			continue
		}
		if l.ViewsCount > lowViewsThreshold {
			continue
		}
		ids = append(ids, l.ID)
	}
	if len(ids) == 0 {
		return nil, false
	}
	return ids, true
}

func findAbandonedListing(metrics domain.YearMetrics) (listingID int64, categoryID int64, ok bool) {
	messaged := metrics.MessagedListingIDs
	fav := metrics.Favorites

	type candidate struct {
		listingID, categoryID int64
		views                 int
		inFav                 bool
	}

	var candidates []candidate
	for _, v := range metrics.ListingViewCounts {
		if slices.Contains(messaged, v.ListingID) {
			continue
		}
		if v.Views < minAbandonedViews {
			continue
		}

		inFav := slices.Contains(fav, domain.YearMetricsFavorite{
			ListingID:  v.ListingID,
			CategoryID: v.CategoryID,
		})

		candidates = append(candidates, candidate{
			listingID:  v.ListingID,
			categoryID: v.CategoryID,
			views:      v.Views,
			inFav:      inFav,
		})
	}
	if len(candidates) == 0 {
		return 0, 0, false
	}

	sort.Slice(candidates, func(i, j int) bool {
		if candidates[i].inFav != candidates[j].inFav {
			return candidates[i].inFav
		}
		return candidates[i].views > candidates[j].views
	})

	return candidates[0].listingID, candidates[0].categoryID, true
}

func findCompareTopTargets(metrics domain.YearMetrics) (categoryID int64, listingIDs []int64, ok bool) {
	countByCategory := map[int64]int{}
	maxCount := 0
	var maxCategoryID int64

	for _, f := range metrics.Favorites {
		countByCategory[f.CategoryID]++
		if countByCategory[f.CategoryID] > maxCount {
			maxCount = countByCategory[f.CategoryID]
			maxCategoryID = f.CategoryID
		}
	}

	if maxCount < minFavoriteCategoryListings {
		return 0, nil, false
	}

	var inCategory []int64
	for _, f := range metrics.Favorites {
		if f.CategoryID == maxCategoryID {
			inCategory = append(inCategory, f.ListingID)
		}
	}

	viewsByListing := map[int64]int{}
	for _, v := range metrics.ListingViewCounts {
		viewsByListing[v.ListingID] = v.Views
	}

	sort.Slice(inCategory, func(i, j int) bool {
		return viewsByListing[inCategory[i]] > viewsByListing[inCategory[j]]
	})

	seen := map[int64]bool{}
	var top []int64
	for _, id := range inCategory {
		if seen[id] {
			continue
		}
		seen[id] = true
		top = append(top, id)
		if len(top) == 3 {
			break
		}
	}

	if len(top) < 3 {
		return 0, nil, false
	}

	return maxCategoryID, top, true
}

func findOpenFavoritesCategory(metrics domain.YearMetrics) (int64, bool) {
	if len(metrics.Favorites) < minFavoriteListings {
		return 0, false
	}
	countByCategory := map[int64]int{}
	maxCount := 0
	var maxCategoryID int64
	for _, f := range metrics.Favorites {
		countByCategory[f.CategoryID]++
		if countByCategory[f.CategoryID] > maxCount {
			maxCount = countByCategory[f.CategoryID]
			maxCategoryID = f.CategoryID
		}
	}
	return maxCategoryID, true
}

func findContinueSearchCategory(metrics domain.YearMetrics) int64 {
	maxViews := 0
	var categoryID int64
	for _, c := range metrics.ViewsByCategory {
		if c.Views > maxViews {
			maxViews = c.Views
			categoryID = c.CategoryID
		}
	}
	if categoryID != 0 {
		return categoryID
	}

	maxSearches := 0
	for _, c := range metrics.SearchesByCategory {
		if c.Searches > maxSearches {
			maxSearches = c.Searches
			categoryID = c.CategoryID
		}
	}
	return categoryID
}

type actionStats struct {
	Label  string `json:"label"`
	Reason string `json:"reason"`
}

//go:embed actions.json
var actionsJSON []byte

var (
	actionCopies     map[string]actionStats
	actionCopiesErr  error
	actionCopiesOnce sync.Once
)

func loadActionCopies() (map[string]actionStats, error) {
	actionCopiesOnce.Do(func() {
		actionCopiesErr = json.Unmarshal(actionsJSON, &actionCopies)
	})
	return actionCopies, actionCopiesErr
}

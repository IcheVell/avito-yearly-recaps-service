package engine

import (
	"encoding/json"
	"errors"
	"slices"
	"sort"
	"sync"
	"time"

	"v1/catalog"
	"v1/internal/domain/recap"
)

const (
	openFavorites    = "open_favorites"
	continueSearch   = "continue_search"
	listingAbandoned = "listing_abandoned"
	boostListings    = "boost_listings"
	createListing    = "create_listing"
	compareTop       = "compare_top"

	minAbandonedViews = 15
	staleDays         = 14
	minSellsForCreate = 5

	scoreWeightBoostListing    = 10 // за каждое stale own listing
	scoreWeightCreateListing   = 8  // за каждую продажу
	scoreWeightAbandonedView   = 2  // за каждый view "смотрел и не писал"
	scoreWeightCompareFavorite = 5  // за каждый favorite в топ-категории
	scoreWeightOpenFavorite    = 2  // за каждый favorite
	scoreWeightContinueView    = 0  // за каждый view
	scoreWeightContinueSearch  = 1  // за каждый search
)

func ResolveAction(metrics recap.YearMetrics) (recap.RecapAction, error) {
	selected := chooseType(metrics)

	actionCopies, err := loadActionCopies()
	if err != nil {
		return recap.RecapAction{}, err
	}

	copyStat, ok := actionCopies[selected.Type]
	if !ok {
		return recap.RecapAction{}, errors.New("action type does not exist in json file")
	}

	return recap.RecapAction{
		Type:   selected.Type,
		Label:  copyStat.Label,
		Reason: copyStat.Reason,
		Target: recap.RecapActionTarget{
			ListingIDs:   selected.ListingIDs,
			CategoryID:   selected.CategoryID,
			CategoryName: selected.CategoryName,
			Listings:     buildActionListings(metrics, selected),
		},
	}, nil
}

type selectedAction struct {
	Type         string
	ListingIDs   []int64
	CategoryID   int64
	CategoryName string
}

func chooseType(metrics recap.YearMetrics) selectedAction {
	types := findPossibleTypes(metrics)
	scores := make(map[string]int)

	maxScoreType := ""
	maxScore := 0
	for _, t := range types {
		scores[t] = getScore(metrics, t)
		if scores[t] > maxScore {
			maxScore = scores[t]
			maxScoreType = t
		}
	}

	return buildTarget(maxScoreType, metrics)
}

func findPossibleTypes(metrics recap.YearMetrics) []string {
	var result []string

	if canBoostListings(metrics, time.Now()) {
		result = append(result, boostListings)
	}

	if canUseListingAbandoned(metrics) {
		result = append(result, listingAbandoned)
	}

	if canCompareTop(metrics) {
		result = append(result, compareTop)
	}

	if len(metrics.Favorites) > 0 {
		result = append(result, openFavorites)
	}

	if metrics.SellsCount >= minSellsForCreate {
		result = append(result, createListing)
	}

	result = append(result, continueSearch)

	return result
}

func canBoostListings(metrics recap.YearMetrics, now time.Time) bool {
	cutoff := now.AddDate(0, 0, -staleDays)
	for _, l := range metrics.OwnListings {
		if l.Status == "active" && !l.UpdatedAt.After(cutoff) {
			return true
		}
	}

	return false
}

func canUseListingAbandoned(metrics recap.YearMetrics) bool {
	messaged := metrics.MessagedListingIDs

	for _, v := range metrics.ListingViewCounts {
		if v.Views < minAbandonedViews {
			continue
		}
		if slices.Contains(messaged, v.ListingID) {
			continue
		}
		return true
	}

	return false
}

func canCompareTop(metrics recap.YearMetrics) bool {
	uniqueByCategory := map[int64]map[int64]struct{}{}

	for _, f := range metrics.Favorites {
		ids, ok := uniqueByCategory[f.CategoryID]
		if !ok {
			ids = map[int64]struct{}{}
			uniqueByCategory[f.CategoryID] = ids
		}
		ids[f.ListingID] = struct{}{}
		if len(ids) >= 3 {
			return true
		}
	}

	return false
}

func getScore(metrics recap.YearMetrics, t string) int {
	switch t {
	case openFavorites:
		return getOpenFavoritesScore(metrics)
	case continueSearch:
		return getContinueSearchScore(metrics)
	case listingAbandoned:
		return getListingAbandonedScore(metrics)
	case boostListings:
		return getBoostListingsScore(metrics, time.Now())
	case createListing:
		return getCreateListingScore(metrics)
	case compareTop:
		return getCompareTopScore(metrics)
	default:
		return 0
	}
}

func getCompareTopScore(metrics recap.YearMetrics) int {
	countByCategory := map[int64]int{}
	maxCount := 0
	for _, f := range metrics.Favorites {
		countByCategory[f.CategoryID]++
		if countByCategory[f.CategoryID] > maxCount {
			maxCount = countByCategory[f.CategoryID]
		}
	}
	if maxCount < 3 {
		return 0
	}
	return maxCount * scoreWeightCompareFavorite
}

func getCreateListingScore(metrics recap.YearMetrics) int {
	return int(metrics.SellsCount) * scoreWeightCreateListing
}

func getBoostListingsScore(metrics recap.YearMetrics, now time.Time) int {
	staleListings := 0

	cutoff := now.AddDate(0, 0, -staleDays)
	for _, l := range metrics.OwnListings {
		if l.Status == "active" && !l.UpdatedAt.After(cutoff) {
			staleListings++
		}
	}

	return staleListings * scoreWeightBoostListing
}

func getListingAbandonedScore(metrics recap.YearMetrics) int {
	messaged := metrics.MessagedListingIDs
	best := 0

	for _, v := range metrics.ListingViewCounts {
		if v.Views < minAbandonedViews {
			continue
		}
		if slices.Contains(messaged, v.ListingID) {
			continue
		}
		if v.Views > best {
			best = v.Views
		}
	}

	return best * scoreWeightAbandonedView
}

func getContinueSearchScore(metrics recap.YearMetrics) int {
	return int(metrics.ViewsCount)*scoreWeightContinueView + int(metrics.SearchesCount)*scoreWeightContinueSearch
}

func getOpenFavoritesScore(metrics recap.YearMetrics) int {
	return len(metrics.Favorites) * scoreWeightOpenFavorite
}

func buildTarget(actionType string, metrics recap.YearMetrics) selectedAction {
	categoryNames := categoryNameByID(metrics)
	resolveCategoryName := func(categoryID int64) string {
		return categoryNames[categoryID]
	}

	switch actionType {
	case boostListings:
		if ids, ok := findStaleListingTargets(metrics, time.Now()); ok {
			return selectedAction{
				Type:       boostListings,
				ListingIDs: ids,
			}
		}

	case listingAbandoned:
		if listingID, categoryID, ok := findAbandonedListing(metrics); ok {
			return selectedAction{
				Type:         listingAbandoned,
				ListingIDs:   []int64{listingID},
				CategoryID:   categoryID,
				CategoryName: resolveCategoryName(categoryID),
			}
		}

	case compareTop:
		if categoryID, listingIDs, ok := findCompareTopTargets(metrics); ok {
			return selectedAction{
				Type:         compareTop,
				CategoryID:   categoryID,
				CategoryName: resolveCategoryName(categoryID),
				ListingIDs:   listingIDs,
			}
		}

	case openFavorites:
		if categoryID, ok := findOpenFavoritesCategory(metrics); ok {
			return selectedAction{
				Type:         openFavorites,
				CategoryID:   categoryID,
				CategoryName: resolveCategoryName(categoryID),
			}
		}

	case createListing:
		return selectedAction{Type: createListing}

	case continueSearch:
		categoryID := findContinueSearchCategory(metrics)
		return selectedAction{
			Type:         continueSearch,
			CategoryID:   categoryID,
			CategoryName: resolveCategoryName(categoryID),
		}
	}

	fallbackCategoryID := findContinueSearchCategory(metrics)
	return selectedAction{
		Type:         continueSearch,
		CategoryID:   fallbackCategoryID,
		CategoryName: resolveCategoryName(fallbackCategoryID),
	}
}

func findStaleListingTargets(metrics recap.YearMetrics, now time.Time) ([]int64, bool) {
	var ids []int64
	cutoff := now.AddDate(0, 0, -staleDays)
	for _, l := range metrics.OwnListings {
		if l.Status != "active" {
			continue
		}
		if l.UpdatedAt.After(cutoff) {
			continue
		}
		ids = append(ids, l.ID)
	}
	if len(ids) == 0 {
		return nil, false
	}
	return ids, true
}

func findAbandonedListing(metrics recap.YearMetrics) (listingID int64, categoryID int64, ok bool) {
	messaged := metrics.MessagedListingIDs
	favoritesByListing := map[int64]bool{}
	for _, favorite := range metrics.Favorites {
		favoritesByListing[favorite.ListingID] = true
	}

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

		inFav := favoritesByListing[v.ListingID]

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

func findCompareTopTargets(metrics recap.YearMetrics) (categoryID int64, listingIDs []int64, ok bool) {
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

func findOpenFavoritesCategory(metrics recap.YearMetrics) (int64, bool) {
	if len(metrics.Favorites) == 0 {
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

func findContinueSearchCategory(metrics recap.YearMetrics) int64 {
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

func buildActionListings(
	metrics recap.YearMetrics,
	selected selectedAction,
) []recap.RecapActionListing {
	if len(selected.ListingIDs) == 0 {
		return nil
	}

	categoryNames := categoryNameByID(metrics)
	ownByID := map[int64]recap.YearMetricsOwnListing{}
	for _, listing := range metrics.OwnListings {
		ownByID[listing.ID] = listing
	}

	viewsByID := map[int64]recap.YearMetricsListingCount{}
	for _, item := range metrics.ListingViewCounts {
		viewsByID[item.ListingID] = item
	}
	favoritesByID := map[int64]recap.YearMetricsFavorite{}
	for _, item := range metrics.Favorites {
		favoritesByID[item.ListingID] = item
	}

	listings := make([]recap.RecapActionListing, 0, len(selected.ListingIDs))
	for _, id := range selected.ListingIDs {
		item := recap.RecapActionListing{ID: id}

		if own, ok := ownByID[id]; ok {
			updatedAt := own.UpdatedAt
			item.Name = own.Name
			item.ImageURL = own.ImageURL
			item.Price = own.Price
			item.City = own.City
			item.CategoryID = own.CategoryID
			item.CategoryName = own.CategoryName
			item.Status = own.Status
			item.ViewsCount = own.ViewsCount
			item.UpdatedAt = &updatedAt
		}

		if views, ok := viewsByID[id]; ok {
			if item.Name == "" {
				item.Name = views.ListingName
			}
			if item.ImageURL == "" {
				item.ImageURL = views.ListingImageURL
			}
			if item.Price == nil {
				item.Price = views.ListingPrice
			}
			if item.City == "" {
				item.City = views.ListingCity
			}
			if item.CategoryID == 0 {
				item.CategoryID = views.CategoryID
			}
			if item.CategoryName == "" {
				item.CategoryName = views.CategoryName
			}
			if item.ViewsCount == 0 {
				item.ViewsCount = views.Views
			}
		}

		if favorite, ok := favoritesByID[id]; ok {
			if item.Name == "" {
				item.Name = favorite.ListingName
			}
			if item.ImageURL == "" {
				item.ImageURL = favorite.ListingImageURL
			}
			if item.Price == nil {
				item.Price = favorite.ListingPrice
			}
			if item.City == "" {
				item.City = favorite.ListingCity
			}
			if item.CategoryID == 0 {
				item.CategoryID = favorite.CategoryID
			}
			if item.CategoryName == "" {
				item.CategoryName = favorite.CategoryName
			}
		}

		if item.CategoryID == 0 {
			item.CategoryID = selected.CategoryID
		}
		if item.CategoryName == "" {
			item.CategoryName = categoryNames[item.CategoryID]
		}

		if metrics.MostViewedListing != nil && metrics.MostViewedListing.ID == id {
			if item.Name == "" {
				item.Name = metrics.MostViewedListing.Name
			}
			if item.ImageURL == "" {
				item.ImageURL = metrics.MostViewedListing.ImageURL
			}
			if item.City == "" {
				item.City = metrics.MostViewedListing.City
			}
			if item.ViewsCount == 0 {
				item.ViewsCount = metrics.MostViewedListing.ViewsCount
			}
		}

		listings = append(listings, item)
	}

	return listings
}

func categoryNameByID(metrics recap.YearMetrics) map[int64]string {
	names := map[int64]string{}
	for _, item := range metrics.ViewsByCategory {
		names[item.CategoryID] = item.CategoryName
	}
	for _, item := range metrics.SearchesByCategory {
		if names[item.CategoryID] == "" {
			names[item.CategoryID] = item.CategoryName
		}
	}
	for _, item := range metrics.Favorites {
		if names[item.CategoryID] == "" {
			names[item.CategoryID] = item.CategoryName
		}
	}
	for _, item := range metrics.ListingViewCounts {
		if names[item.CategoryID] == "" {
			names[item.CategoryID] = item.CategoryName
		}
	}
	for _, item := range metrics.OwnListings {
		if names[item.CategoryID] == "" {
			names[item.CategoryID] = item.CategoryName
		}
	}
	if metrics.FavoriteBuyCategory != nil {
		names[metrics.FavoriteBuyCategory.ID] = metrics.FavoriteBuyCategory.Name
	}
	if metrics.FavoriteSellCategory != nil {
		names[metrics.FavoriteSellCategory.ID] = metrics.FavoriteSellCategory.Name
	}
	return names
}

type actionStats struct {
	Label  string `json:"label"`
	Reason string `json:"reason"`
}

var (
	actionCopies     map[string]actionStats
	actionCopiesErr  error
	actionCopiesOnce sync.Once
)

func loadActionCopies() (map[string]actionStats, error) {
	actionCopiesOnce.Do(func() {
		actionCopiesErr = json.Unmarshal(catalog.ActionsJSON, &actionCopies)
	})
	return actionCopies, actionCopiesErr
}

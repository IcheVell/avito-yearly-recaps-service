package engine

import (
	"reflect"
	"testing"
	"time"
	"v1/internal/domain"
)

func TestChooseType_SellerBoostListings(t *testing.T) {
	old := time.Now().AddDate(0, 0, -30)
	m := domain.YearMetrics{
		SellsCount: 10,
		OwnListings: []domain.YearMetricsOwnListing{
			{ID: 1, Status: "active", UpdatedAt: old, ViewsCount: 1},
			{ID: 2, Status: "active", UpdatedAt: old, ViewsCount: 3},
			{ID: 3, Status: "active", UpdatedAt: old, ViewsCount: 5},
		},
	}

	got := chooseType(m, "seller")

	if got.Type != boostListings {
		t.Fatalf("Type = %q, want %q", got.Type, boostListings)
	}
	wantIDs := []int64{1, 2, 3}
	if !reflect.DeepEqual(got.ListingIDs, wantIDs) {
		t.Fatalf("ListingIDs = %v, want %v", got.ListingIDs, wantIDs)
	}
}

func TestChooseType_ListingAbandoned(t *testing.T) {
	m := domain.YearMetrics{
		ListingViewCounts: []domain.YearMetricsListingCount{
			{ListingID: 100, CategoryID: 7, Views: 12},
		},
		MessagedListingIDs: []int64{200},
		Favorites: []domain.YearMetricsFavorite{
			{ListingID: 100, CategoryID: 7},
		},
	}

	got := chooseType(m, "buyer")

	if got.Type != listingAbandoned {
		t.Fatalf("Type = %q, want %q", got.Type, listingAbandoned)
	}
	if len(got.ListingIDs) != 1 || got.ListingIDs[0] != 100 {
		t.Fatalf("ListingIDs = %v, want [100]", got.ListingIDs)
	}
	if got.CategoryID != 7 {
		t.Fatalf("CategoryID = %d, want 7", got.CategoryID)
	}
}

func TestChooseType_CompareTop(t *testing.T) {
	m := domain.YearMetrics{
		Favorites: []domain.YearMetricsFavorite{
			{ListingID: 1, CategoryID: 5},
			{ListingID: 2, CategoryID: 5},
			{ListingID: 3, CategoryID: 5},
			{ListingID: 4, CategoryID: 5},
			{ListingID: 5, CategoryID: 5},
		},
		ListingViewCounts: []domain.YearMetricsListingCount{
			{ListingID: 1, CategoryID: 5, Views: 10},
			{ListingID: 2, CategoryID: 5, Views: 50},
			{ListingID: 3, CategoryID: 5, Views: 30},
			{ListingID: 4, CategoryID: 5, Views: 20},
			{ListingID: 5, CategoryID: 5, Views: 40},
		},
		// Exclude "abandoned listing" branch by marking all candidates as messaged.
		MessagedListingIDs: []int64{1, 2, 3, 4, 5},
	}

	got := chooseType(m, "buyer")

	if got.Type != compareTop {
		t.Fatalf("Type = %q, want %q", got.Type, compareTop)
	}
	if got.CategoryID != 5 {
		t.Fatalf("CategoryID = %d, want 5", got.CategoryID)
	}
	wantIDs := []int64{2, 5, 3}
	if !reflect.DeepEqual(got.ListingIDs, wantIDs) {
		t.Fatalf("ListingIDs = %v, want %v", got.ListingIDs, wantIDs)
	}
}

func TestChooseType_FallbackContinueSearch(t *testing.T) {
	m := domain.YearMetrics{
		ViewsByCategory: []domain.YearMetricsViews{
			{CategoryID: 9, Views: 100},
			{CategoryID: 3, Views: 20},
		},
	}

	got := chooseType(m, "watcher")

	if got.Type != continueSearch {
		t.Fatalf("Type = %q, want %q", got.Type, continueSearch)
	}
	if got.CategoryID != 9 {
		t.Fatalf("CategoryID = %d, want 9", got.CategoryID)
	}
}

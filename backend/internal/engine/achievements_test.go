package engine

import (
	"reflect"
	"testing"
	"v1/internal/domain/recap"
)

func TestResolveAchievements_Empty(t *testing.T) {
	got := ResolveAchievements(recap.YearMetrics{})
	if len(got) != 0 {
		t.Fatalf("got %d achievements, want 0", len(got))
	}
}

func TestResolveAchievements_MapsAllWhenFew(t *testing.T) {
	m := recap.YearMetrics{
		YearAchievements: []recap.YearAchievement{
			{Code: "diplomat", Name: "Дипломат", Description: "desc1", ImageURL: "u1"},
			{Code: "unbending", Name: "Несгибаемый", Description: "desc2", ImageURL: "u2"},
		},
	}

	got := ResolveAchievements(m)

	want := []recap.RecapAchievement{
		{Code: "diplomat", Name: "Дипломат", Description: "desc1", ImageURL: "u1"},
		{Code: "unbending", Name: "Несгибаемый", Description: "desc2", ImageURL: "u2"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v, want %#v", got, want)
	}
}

func TestResolveAchievements_TruncatesToThree(t *testing.T) {
	m := recap.YearMetrics{
		YearAchievements: []recap.YearAchievement{
			{Code: "a1", Name: "n1", Description: "d1", ImageURL: "i1"},
			{Code: "a2", Name: "n2", Description: "d2", ImageURL: "i2"},
			{Code: "a3", Name: "n3", Description: "d3", ImageURL: "i3"},
			{Code: "a4", Name: "n4", Description: "d4", ImageURL: "i4"},
		},
	}

	got := ResolveAchievements(m)
	if len(got) != achievementsNum {
		t.Fatalf("got %d achievements, want %d", len(got), achievementsNum)
	}
	if got[0].Code != "a1" || got[2].Code != "a3" {
		t.Fatalf("unexpected truncation order: %#v", got)
	}
}

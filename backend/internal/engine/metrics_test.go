package engine

import (
	"testing"

	"v1/internal/domain/recap"
)

func TestResolveMetrics_OK(t *testing.T) {
	var earned int64 = 120_000
	var spent int64 = 48_000

	m := recap.YearMetrics{
		EarnedAmount:  &earned,
		SpentAmount:   &spent,
		MaxStreakDays: 14,
		ActiveDays:    120,
		ViewsCount:    847,
	}

	got, err := ResolveMetrics(m)
	if err != nil {
		t.Fatalf("ResolveMetrics() error = %v", err)
	}

	if len(got) == 0 || len(got) > desiredNumberMetrics+desiredComparisonMetrics+desiredQualitativeMetrics {
		t.Fatalf("len(metrics) = %d, want 1..3", len(got))
	}

	for _, metric := range got {
		if metric.Type == "" {
			t.Fatalf("empty Type: %+v", metric)
		}
		if metric.Title == "" || metric.Text == "" {
			t.Fatalf("empty title/text: %+v", metric)
		}
		if len(metric.Highlights) == 0 || metric.Highlights[0] == "" {
			t.Fatalf("empty highlights: %+v", metric)
		}
	}
}

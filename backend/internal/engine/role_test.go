package engine

import (
	"testing"
	"v1/internal/domain/recap"
)

func TestResolveRole(t *testing.T) {
	tests := []struct {
		name        string
		wantName    string
		in          recap.YearMetrics
		wantCode    string
		wantPercent *int // nil = любой в 1..100
	}{
		{
			name:     "seller",
			wantName: "Продавец",
			in: recap.YearMetrics{
				ListingsCreatedCount: 20,
				SellsCount:           15,
				ViewsCount:           10,
				SearchesCount:        2,
				FavoritesCount:       1,
				BuysCount:            0,
			},
			wantCode: seller,
		},
		{
			name:     "buyer",
			wantName: "Покупатель",
			in: recap.YearMetrics{
				ListingsCreatedCount: 3,
				SellsCount:           2,
				ViewsCount:           10,
				SearchesCount:        5,
				FavoritesCount:       15,
				BuysCount:            13,
			},
			wantCode: buyer,
		},
		{
			name:     "watcher",
			wantName: "Наблюдатель",
			in: recap.YearMetrics{
				ViewsCount:    500,
				SearchesCount: 100,
			},
			wantCode: watcher,
		},
		{
			name:        "all zeros",
			in:          recap.YearMetrics{},
			wantName:    "Наблюдатель",
			wantCode:    watcher,
			wantPercent: intPtr(100),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			role, err := ResolveRole(tt.in)
			if err != nil {
				t.Fatalf("ResolveRole() error = %v", err)
			}

			if role.Name != tt.wantName {
				t.Errorf("ResolveRole().Name = %v, want %v", role.Name, tt.wantName)
			}

			if role.Code != tt.wantCode {
				t.Fatalf("Code = %q, want %q", role.Code, tt.wantCode)
			}

			if tt.wantPercent != nil {
				if role.ActivitySharePercent != *tt.wantPercent {
					t.Fatalf("ActivitySharePercent = %d, want %d", role.ActivitySharePercent, *tt.wantPercent)
				}
			} else if role.ActivitySharePercent <= 0 || role.ActivitySharePercent > 100 {
				t.Fatalf("ActivitySharePercent = %d, want in 1..100", role.ActivitySharePercent)
			}

			if role.Title == "" || role.Subtitle == "" || role.Why == "" {
				t.Fatalf("empty texts: %+v", role)
			}
		})
	}
}

func intPtr(v int) *int {
	return &v
}

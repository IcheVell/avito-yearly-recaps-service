import type { YearMetrics } from '../../../entities/stats/types';

import { formatNumber } from './formatters';
import { MostViewedListingCard } from './MostViewedListingCard';
import styles from './StatisticsPanel.module.css';

type StatisticsDetailsProps = {
  stats: YearMetrics;
};

function FavoriteCategoriesCard({ stats }: StatisticsDetailsProps) {
  return (
    <section className={`${styles.detailCard} ${styles.favoriteCategoriesCard}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailIcon} aria-hidden="true">
          ♡
        </span>
        <h3>Любимые категории</h3>
      </div>
      <dl className={styles.categoryPairs}>
        <div>
          <dt>Покупки</dt>
          <dd>{stats.favoriteBuyCategory?.name ?? 'Не определена'}</dd>
        </div>
        <div>
          <dt>Продажи</dt>
          <dd>{stats.favoriteSellCategory?.name ?? 'Не определена'}</dd>
        </div>
      </dl>
    </section>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className={styles.reviewStars} aria-label={`Оценка ${rating} из 5`}>
      {'★'.repeat(safeRating)}
      <span aria-hidden="true">{'★'.repeat(5 - safeRating)}</span>
    </span>
  );
}

function ReviewsCard({ stats }: StatisticsDetailsProps) {
  return (
    <section className={`${styles.detailCard} ${styles.reviewsCard}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailIcon} aria-hidden="true">
          ★
        </span>
        <h3>Лучшие отзывы</h3>
      </div>
      <div className={styles.reviews}>
        <blockquote>
          <strong>Получили</strong>
          {stats.bestReviewReceived && (
            <ReviewStars rating={stats.bestReviewReceived.rating} />
          )}
          <p>
            «{stats.bestReviewReceived?.text ?? 'Отзывов пока нет.'}»
          </p>
        </blockquote>
        <blockquote>
          <strong>Оставили</strong>
          {stats.bestReviewLeft && (
            <ReviewStars rating={stats.bestReviewLeft.rating} />
          )}
          <p>«{stats.bestReviewLeft?.text ?? 'Отзывов пока нет.'}»</p>
        </blockquote>
      </div>
    </section>
  );
}

function CategoryActivityCard({ stats }: StatisticsDetailsProps) {
  const categoriesMap = new Map<number, { id: number; name: string; views: number; searches: number }>();

  stats.viewsByCategory.forEach((category) => {
    categoriesMap.set(category.categoryId, {
      id: category.categoryId,
      name: category.categoryName,
      views: category.views,
      searches: 0,
    });
  });

  stats.searchesByCategory.forEach((category) => {
    const existing = categoriesMap.get(category.categoryId);

    if (existing) {
      existing.searches = category.searches;
      return;
    }

    categoriesMap.set(category.categoryId, {
      id: category.categoryId,
      name: category.categoryName,
      views: 0,
      searches: category.searches,
    });
  });

  const categories = Array.from(categoriesMap.values()).sort(
    (a, b) => b.views + b.searches - (a.views + a.searches),
  );

  return (
    <section className={`${styles.detailCard} ${styles.categoryActivityCard}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailIcon} aria-hidden="true">
          ↗
        </span>
        <div>
          <h3>Активность по категориям</h3>
          <p>Что чаще всего привлекало внимание</p>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className={styles.categoryActivityList}>
          {categories.map((category, index) => {
            return (
              <article key={category.id} className={styles.categoryActivityRow}>
                <div className={styles.categoryActivityRowHeader}>
                  <div className={styles.categoryActivityRowTitle}>
                    <span className={styles.categoryActivityRank}>{index + 1}</span>
                    <div>
                      <h4>{category.name}</h4>
                    </div>
                  </div>
                </div>

                <div className={styles.categoryActivityMetrics}>
                  <div className={`${styles.categoryActivityMetric} ${styles.categoryActivityMetricViews}`}>
                    <span className={styles.categoryActivityMetricLabel}>Просмотры</span>
                    <strong>{formatNumber(category.views)}</strong>
                  </div>

                  <div className={`${styles.categoryActivityMetric} ${styles.categoryActivityMetricSearches}`}>
                    <span className={styles.categoryActivityMetricLabel}>Поиски</span>
                    <strong>{formatNumber(category.searches)}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.muted}>Недостаточно данных.</p>
      )}
    </section>
  );
}

function ActivityDetailsCard({ stats }: StatisticsDetailsProps) {
  const activityItems = [
    ['Сохранённые', stats.favorites.length],
    ['Просмотренные', stats.listingViewCounts.length],
    ['С сообщениями', stats.messagedListingIds.length],
  ];

  return (
    <section className={`${styles.detailCard} ${styles.activityDetailsCard}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailIcon} aria-hidden="true">
          ◫
        </span>
        <div>
          <h3>Объявления</h3>
          <p>Как взаимодействовали с объявлениями</p>
        </div>
      </div>

      <div className={styles.activityDetailsBody}>
        <div className={styles.ownListingsSummary}>
          <div>
            <span>Собственные объявления</span>
            <strong>{formatNumber(stats.ownListings.length)}</strong>
          </div>
          <span className={styles.ownListingsBadge}>Всего</span>
        </div>

        <dl className={styles.activityDetailsList}>
          {activityItems.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{formatNumber(Number(value))}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function StatisticsDetails({ stats }: StatisticsDetailsProps) {
  return (
    <div className={styles.detailsGrid}>
      <FavoriteCategoriesCard stats={stats} />
      <MostViewedListingCard listing={stats.mostViewedListing} />
      <ReviewsCard stats={stats} />
      <CategoryActivityCard stats={stats} />
      <ActivityDetailsCard stats={stats} />
    </div>
  );
}

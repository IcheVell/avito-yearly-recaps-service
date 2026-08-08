import type { YearMetrics } from '../../../entities/stats/types';

import { formatNumber } from './formatters';
import { MostViewedListingCard } from './MostViewedListingCard';
import styles from './StatisticsPanel.module.css';

type StatisticsDetailsProps = {
  stats: YearMetrics;
};

function FavoriteCategoriesCard({ stats }: StatisticsDetailsProps) {
  return (
    <section className={styles.detailCard}>
      <h3>Любимые категории</h3>
      <dl className={styles.compactList}>
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

function ReviewsCard({ stats }: StatisticsDetailsProps) {
  return (
    <section className={styles.detailCard}>
      <h3>Лучшие отзывы</h3>
      <div className={styles.reviews}>
        <blockquote>
          <strong>Полученный</strong>
          <p>{stats.bestReviewReceived?.text ?? 'Отзывов пока нет.'}</p>
          {stats.bestReviewReceived && (
            <span>Оценка: {stats.bestReviewReceived.rating}/5</span>
          )}
        </blockquote>
        <blockquote>
          <strong>Оставленный</strong>
          <p>{stats.bestReviewLeft?.text ?? 'Отзывов пока нет.'}</p>
          {stats.bestReviewLeft && (
            <span>Оценка: {stats.bestReviewLeft.rating}/5</span>
          )}
        </blockquote>
      </div>
    </section>
  );
}

function CategoryActivityCard({ stats }: StatisticsDetailsProps) {
  return (
    <section className={styles.detailCard}>
      <h3>Активность по категориям</h3>
      <div className={styles.categoryActivity}>
        {stats.viewsByCategory.map((category) => {
          const searches = stats.searchesByCategory.find(
            (item) => item.categoryId === category.categoryId,
          );

          return (
            <div key={category.categoryId}>
              <strong>{category.categoryName}</strong>
              <span>
                {formatNumber(category.views)} просмотров ·{' '}
                {formatNumber(searches?.searches ?? 0)} поисков
              </span>
            </div>
          );
        })}
        {stats.viewsByCategory.length === 0 && (
          <p className={styles.muted}>Недостаточно данных.</p>
        )}
      </div>
    </section>
  );
}

function ActivityDetailsCard({ stats }: StatisticsDetailsProps) {
  const items = [
    ['Сохранённые объявления', stats.favorites.length],
    ['Просмотренные объявления', stats.listingViewCounts.length],
    ['Объявления с сообщениями', stats.messagedListingIds.length],
    ['Собственные объявления', stats.ownListings.length],
  ];

  return (
    <section className={styles.detailCard}>
      <h3>Детализация активности</h3>
      <dl className={styles.compactList}>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatNumber(Number(value))}</dd>
          </div>
        ))}
      </dl>
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

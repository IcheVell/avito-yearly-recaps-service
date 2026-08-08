import { useState } from 'react';

import type { YearMetrics } from '../../entities/stats/types';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';

import styles from './ProfileTabs.module.css';

type StatisticsPanelProps = {
  stats: YearMetrics | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

const numberFormatter = new Intl.NumberFormat('ru-RU');
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatCurrency(value: number | null): string {
  return value === null ? 'Нет данных' : currencyFormatter.format(value);
}

function formatRegistrationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Дата неизвестна'
    : dateFormatter.format(date);
}

function ListingPreview({ stats }: { stats: YearMetrics }) {
  const [hasImageError, setHasImageError] = useState(false);
  const listing = stats.mostViewedListing;

  if (!listing) {
    return (
      <section className={styles.detailCard}>
        <h3>Самое просматриваемое объявление</h3>
        <p className={styles.muted}>Недостаточно данных.</p>
      </section>
    );
  }

  return (
    <section className={styles.detailCard}>
      <h3>Самое просматриваемое объявление</h3>
      <div className={styles.listingPreview}>
        {listing.imageUrl && !hasImageError && (
          <img
            src={listing.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        )}
        <div>
          <strong>{listing.name}</strong>
          <span>{listing.city}</span>
          <span>
            {numberFormatter.format(listing.viewsCount)} просмотров
          </span>
        </div>
      </div>
    </section>
  );
}

export function StatisticsPanel({
  stats,
  isLoading,
  errorMessage,
  onRetry,
}: StatisticsPanelProps) {
  if (isLoading) {
    return <Loader label="Загружаем статистику…" />;
  }

  if (errorMessage) {
    return <ErrorMessage message={errorMessage} onRetry={onRetry} />;
  }

  if (!stats) {
    return (
      <p className={styles.emptyState}>
        Данные статистики пока недоступны.
      </p>
    );
  }

  const summary = [
    ['Просмотры', numberFormatter.format(stats.viewsCount)],
    ['Поиски', numberFormatter.format(stats.searchesCount)],
    ['В избранном', numberFormatter.format(stats.favoritesCount)],
    ['Собеседники', numberFormatter.format(stats.messagesPeopleCount)],
    ['Новые объявления', numberFormatter.format(stats.listingsCreatedCount)],
    ['Покупки', numberFormatter.format(stats.buysCount)],
    ['Продажи', numberFormatter.format(stats.sellsCount)],
    ['Потрачено', formatCurrency(stats.spentAmount)],
    ['Заработано', formatCurrency(stats.earnedAmount)],
    ['Активные дни', numberFormatter.format(stats.activeDays)],
    ['Максимальная серия', `${numberFormatter.format(stats.maxStreakDays)} дн.`],
    ['Лет на Avito', numberFormatter.format(stats.yearsOnAvito)],
    [
      'Рейтинг продавца',
      stats.sellerRating === null
        ? 'Нет данных'
        : stats.sellerRating.toLocaleString('ru-RU'),
    ],
    ['Минимальная цена', formatCurrency(stats.priceMin)],
    ['Максимальная цена', formatCurrency(stats.priceMax)],
  ];

  return (
    <div className={styles.statistics}>
      <header className={styles.statisticsHeader}>
        <div>
          <h2>Статистика профиля</h2>
          <p>
            С нами с {formatRegistrationDate(stats.registrationDate)}
          </p>
        </div>
      </header>

      <dl className={styles.statsGrid}>
        {summary.map(([label, value]) => (
          <div key={label} className={styles.statCard}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.detailsGrid}>
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

        <ListingPreview stats={stats} />

        <section className={styles.detailCard}>
          <h3>Лучшие отзывы</h3>
          <div className={styles.reviews}>
            <blockquote>
              <strong>Полученный</strong>
              <p>
                {stats.bestReviewReceived?.text ?? 'Отзывов пока нет.'}
              </p>
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
                    {numberFormatter.format(category.views)} просмотров ·{' '}
                    {numberFormatter.format(searches?.searches ?? 0)} поисков
                  </span>
                </div>
              );
            })}
            {stats.viewsByCategory.length === 0 && (
              <p className={styles.muted}>Недостаточно данных.</p>
            )}
          </div>
        </section>

        <section className={styles.detailCard}>
          <h3>Детализация активности</h3>
          <dl className={styles.compactList}>
            <div>
              <dt>Сохранённые объявления</dt>
              <dd>{numberFormatter.format(stats.favorites.length)}</dd>
            </div>
            <div>
              <dt>Просмотренные объявления</dt>
              <dd>{numberFormatter.format(stats.listingViewCounts.length)}</dd>
            </div>
            <div>
              <dt>Объявления с сообщениями</dt>
              <dd>{numberFormatter.format(stats.messagedListingIds.length)}</dd>
            </div>
            <div>
              <dt>Собственные объявления</dt>
              <dd>{numberFormatter.format(stats.ownListings.length)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

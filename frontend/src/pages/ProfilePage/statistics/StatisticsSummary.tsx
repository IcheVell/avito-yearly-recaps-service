import type { YearMetrics } from '../../../entities/stats/types';

import {
  formatCurrency,
  formatNumber,
  formatRegistrationDate,
} from './formatters';
import styles from './StatisticsPanel.module.css';

type StatisticsSummaryProps = {
  stats: YearMetrics;
  year: number;
};

type Metric = {
  label: string;
  value: string;
};

function formatNullableCurrency(value: number | null) {
  return value === null ? 'Нет данных' : formatCurrency(value);
}

function MetricValue({ metric, compact = false }: { metric: Metric; compact?: boolean }) {
  return (
    <div className={compact ? styles.compactMetricCard : styles.metricItem}>
      <strong>{metric.value}</strong>
      <span>{metric.label}</span>
    </div>
  );
}

export function StatisticsSummary({ stats, year }: StatisticsSummaryProps) {
  const mainMetrics: Metric[] = [
    { label: 'Продаж', value: formatNumber(stats.sellsCount) },
    { label: 'Заработано', value: formatCurrency(stats.earnedAmount) },
    { label: 'Покупок', value: formatNumber(stats.buysCount) },
    { label: 'Потрачено', value: formatCurrency(stats.spentAmount) },
  ];

  const primaryHighlights: Metric[] = [
    {
      label: 'Активных дней',
      value: formatNumber(stats.activeDays),
    },
    {
      label: 'Максимальная серия',
      value: `${formatNumber(stats.maxStreakDays)} дн.`,
    },
    {
      label: 'Средняя продажа',
      value:
        stats.earnedAmount !== null && stats.sellsCount > 0
          ? formatCurrency(stats.earnedAmount / stats.sellsCount)
          : 'Нет данных',
    },
    {
      label: 'Средняя покупка',
      value:
        stats.spentAmount !== null && stats.buysCount > 0
          ? formatCurrency(stats.spentAmount / stats.buysCount)
          : 'Нет данных',
    },
  ];

  const activityMetrics: Metric[] = [
    { label: 'Просмотров', value: formatNumber(stats.viewsCount) },
    { label: 'Поисков', value: formatNumber(stats.searchesCount) },
    { label: 'В избранном', value: formatNumber(stats.favoritesCount) },
    { label: 'Собеседников', value: formatNumber(stats.messagesPeopleCount) },
    { label: 'Активных дней', value: formatNumber(stats.activeDays) },
    { label: 'Серия без пропусков', value: `${formatNumber(stats.maxStreakDays)} дн.` },
  ];

  const salesMetrics: Metric[] = [
    {
      label: 'Новых объявлений',
      value: formatNumber(stats.listingsCreatedCount),
    },
    {
      label: 'Продаж',
      value: formatNumber(stats.sellsCount),
    },
    {
      label: 'Рейтинг продавца',
      value:
        stats.sellerRating === null ? 'Нет данных' : `★ ${formatNumber(stats.sellerRating)}`,
    },
  ];

  return (
    <div className={styles.summarySection}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Активность за {year} год</p>
          <h2>Статистика профиля</h2>
          <p className={styles.profileSince}>
            С нами с {formatRegistrationDate(stats.registrationDate)} ·{' '}
            {formatNumber(stats.yearsOnAvito)} лет на Avito
          </p>
        </div>
        <span className={styles.yearBadge}>{year}</span>
      </header>

      <section className={styles.primaryStats} aria-labelledby="main-stats-title">
        <div className={styles.sectionHeadingRow}>
          <div>
            <p className={styles.sectionEyebrow}>Главное</p>
            <h3 id="main-stats-title">Результаты года</h3>
          </div>
        </div>

        <div className={styles.primaryMetricsGrid}>
          {mainMetrics.map((metric) => (
            <MetricValue key={metric.label} metric={metric} />
          ))}
        </div>

        <div className={styles.primaryHighlightsGrid}>
          {primaryHighlights.map((metric) => (
            <MetricValue key={metric.label} metric={metric} compact />
          ))}
        </div>
      </section>

      <div className={styles.summaryColumns}>
        <section className={styles.statGroup} aria-labelledby="activity-title">
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.sectionEyebrow}>Активность</p>
              <h3 id="activity-title">Как пользовались Avito</h3>
            </div>
          </div>

          <div className={styles.compactMetricsGrid}>
            {activityMetrics.map((metric) => (
              <MetricValue key={metric.label} metric={metric} compact />
            ))}
          </div>
        </section>

        <section className={styles.statGroup} aria-labelledby="sales-title">
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.sectionEyebrow}>Продажи</p>
              <h3 id="sales-title">Объявления и репутация</h3>
            </div>
          </div>

          <div className={styles.compactMetricsGrid}>
            {salesMetrics.map((metric) => (
              <MetricValue key={metric.label} metric={metric} compact />
            ))}
          </div>

          <div className={styles.priceCardsGrid}>
            <div className={styles.priceCard}>
              <span>Минимальная цена</span>
              <strong>{formatNullableCurrency(stats.priceMin)}</strong>
            </div>
            <div className={styles.priceCard}>
              <span>Максимальная цена</span>
              <strong>{formatNullableCurrency(stats.priceMax)}</strong>
            </div>
            <div className={styles.priceRangeBadge}>
              <span>Диапазон</span>
              <strong>
                {stats.priceMin !== null && stats.priceMax !== null
                  ? formatNullableCurrency(stats.priceMax - stats.priceMin)
                  : 'Нет данных'}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

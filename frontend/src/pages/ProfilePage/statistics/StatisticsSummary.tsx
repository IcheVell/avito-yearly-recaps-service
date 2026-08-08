import type { YearMetrics } from '../../../entities/stats/types';

import {
  formatCurrency,
  formatNumber,
  formatRegistrationDate,
} from './formatters';
import styles from './StatisticsPanel.module.css';

type StatisticsSummaryProps = {
  stats: YearMetrics;
};

export function StatisticsSummary({ stats }: StatisticsSummaryProps) {
  const items = [
    ['Просмотры', formatNumber(stats.viewsCount)],
    ['Поиски', formatNumber(stats.searchesCount)],
    ['В избранном', formatNumber(stats.favoritesCount)],
    ['Собеседники', formatNumber(stats.messagesPeopleCount)],
    ['Новые объявления', formatNumber(stats.listingsCreatedCount)],
    ['Покупки', formatNumber(stats.buysCount)],
    ['Продажи', formatNumber(stats.sellsCount)],
    ['Потрачено', formatCurrency(stats.spentAmount)],
    ['Заработано', formatCurrency(stats.earnedAmount)],
    ['Активные дни', formatNumber(stats.activeDays)],
    ['Максимальная серия', `${formatNumber(stats.maxStreakDays)} дн.`],
    ['Лет на Avito', formatNumber(stats.yearsOnAvito)],
    [
      'Рейтинг продавца',
      stats.sellerRating === null
        ? 'Нет данных'
        : formatNumber(stats.sellerRating),
    ],
    ['Минимальная цена', formatCurrency(stats.priceMin)],
    ['Максимальная цена', formatCurrency(stats.priceMax)],
  ];

  return (
    <>
      <header className={styles.header}>
        <h2>Статистика профиля</h2>
        <p>
          С нами с {formatRegistrationDate(stats.registrationDate)}
        </p>
      </header>

      <dl className={styles.summaryGrid}>
        {items.map(([label, value]) => (
          <div key={label} className={styles.summaryCard}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

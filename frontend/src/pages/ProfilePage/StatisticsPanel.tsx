import type { YearMetrics } from '../../entities/stats/types';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';

import styles from './statistics/StatisticsPanel.module.css';
import { StatisticsDetails } from './statistics/StatisticsDetails';
import { StatisticsSummary } from './statistics/StatisticsSummary';

type StatisticsPanelProps = {
  stats: YearMetrics | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

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
      <p className={styles.emptyState}>Данные статистики пока недоступны.</p>
    );
  }

  return (
    <div className={styles.panel}>
      <StatisticsSummary stats={stats} />
      <StatisticsDetails stats={stats} />
    </div>
  );
}

import { CloseRecapButton } from '../../features/close-recap/CloseRecapButton';
import { MetricCard } from '../../entities/recap/MetricCard';
import type { Recap } from '../../entities/recap/types';
import styles from './RecapOverlay.module.css';

type RecapOverlayProps = {
  recap: Recap;
  onClose: () => void;
};

export function RecapOverlay({
  recap,
  onClose,
}: RecapOverlayProps) {
  return (
    <div
      // Главный затемнённый слой.
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Итоги ${recap.year} года`}
    >
      <CloseRecapButton onClose={onClose} />

      <div className={styles.progress}>

        {recap.metrics.map((metric) => (
          <span
            key={metric.id}
            className={styles.progressItem}
          />
        ))}
      </div>

      {/* Горизонтальный контейнер карточек. */}
      <div className={styles.track}>
        {recap.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
          />
        ))}
      </div>
    </div>
  );
}
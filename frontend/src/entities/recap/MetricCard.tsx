import type {Metric} from './types';

import styles from './MetricCard.module.css';


type MetricCardProps = {
    metric: Metric;
};

export function MetricCard({ metric }: MetricCardProps) {
    return (
    <article
      className={`${styles.card} ${styles[metric.variant]}`}
    >
      {/* Верхняя часть карточки. */}
      <header className={styles.header}>
        {/* Временная текстовая имитация логотипа. */}
        <span className={styles.logo}>
          <span
            className={styles.logoDots}
            aria-hidden="true"
          >
            ● ● ●
          </span>

          Avito
        </span>

        <h2>{metric.title}</h2>
      </header>

      <strong className={styles.value}>
        {metric.value}
      </strong>

      <p className={styles.text}>
        {metric.text}
      </p>
    </article>
  );
}
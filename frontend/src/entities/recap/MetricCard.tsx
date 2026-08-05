import type {CardVariant} from './cardVariants';
import {getPayloadString} from './payloadHelper';
import type {RecapMetric} from './types';
import styles from './RecapCard.module.css';
import logoSrc from '../../assets/logo.svg.webp';


type MetricCardProps = {
  metric: RecapMetric;
  variant: CardVariant;
};

export function MetricCard({metric, variant}: MetricCardProps) {

  const mainHighlight = metric.highlights[0] ?? '—';
  const isLongValue = mainHighlight.length > 11;

  const imageUrl = getPayloadString(metric.payload, 'imageUrl');
  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <header className={styles.header}>
        <img src={logoSrc} alt="Avito" className={styles.logoImage} />
        <h2 className={styles.title}>{metric.title}</h2>
      </header>

      {imageUrl && (
        <img
          className={styles.image}
          src={imageUrl}
          alt=""
          loading="lazy"
        />
      )}
      <strong
        className={`${styles.value} ${styles.highlightValue} ${
          isLongValue ? styles.valueLong : ''
        }`}
      >
        {mainHighlight}
      </strong>

      <p className={styles.text}>{metric.text}</p>
    </article>
  );
}

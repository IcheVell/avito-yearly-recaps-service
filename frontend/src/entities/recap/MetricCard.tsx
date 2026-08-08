import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import type { CardVariant } from './cardVariants';
import { getPayloadString } from './payloadHelper';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
import type { RecapMetric } from './types';

import styles from './RecapCard.module.css';

type MetricCardProps = {
  metric: RecapMetric;
  variant: CardVariant;
  isActive: boolean;
};

export function MetricCard({
  metric,
  variant,
  isActive,
}: MetricCardProps) {
  const mainHighlight = metric.highlights[0] ?? '—';
  const isLongValue = mainHighlight.length > 11;

  const imageUrl = getPayloadString(metric.payload, 'imageUrl');

  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
    >
      <RecapCardHeader title={metric.title} />

      {imageUrl && (
        <SafeImage
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
    </RecapCardShell>
  );
}

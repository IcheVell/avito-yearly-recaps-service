import type { ReactNode } from 'react';

import { FitText } from '../../shared/ui/FitText/FitText';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import type { CardVariant } from './cardVariants';
import { getPayloadString } from './payloadHelper';
import { RecapCardHeader } from './RecapCardHeader';
import { RecapCardShell } from './RecapCardShell';
import { truncateText } from './truncateText';
import type { RecapMetric } from './types';

import styles from './RecapCard.module.css';

type MetricCardProps = {
  metric: RecapMetric;
  variant: CardVariant;
  isActive: boolean;
};

const SHORT_HIGHLIGHT_LENGTH = 18;

function glueNumericPhrases(value: string): string {
  return value
    .replace(/(\d)-/g, '$1\u2011')
    .replace(/(?<=[\d₽★%]) +| +(?=[\d₽★%])/g, '\u00A0');
}

function renderTextWithHighlight(text: string, highlight: string): ReactNode {
  if (!highlight || !text.includes(highlight)) {
    return glueNumericPhrases(text);
  }

  const preparedHighlight = glueNumericPhrases(highlight);
  const keepTogether = highlight.length <= SHORT_HIGHLIGHT_LENGTH;
  const parts = text.split(highlight);

  return parts.flatMap((part, index) => {
    if (index === parts.length - 1) {
      return [glueNumericPhrases(part)];
    }

    return [
      glueNumericPhrases(part),
      <span
        key={`highlight-${index}`}
        className={keepTogether ? styles.textHighlight : undefined}
      >
        {preparedHighlight}
      </span>,
    ];
  });
}

export function MetricCard({ metric, variant, isActive }: MetricCardProps) {
  const mainHighlight = metric.highlights[0] ?? '—';
  const displayHighlight = glueNumericPhrases(mainHighlight);
  const bodyText = truncateText(metric.text);
  const imageUrl = getPayloadString(metric.payload, 'imageUrl');

  return (
    <RecapCardShell
      variant={variant}
      isActive={isActive}
      className={`${styles.metricCard} ${imageUrl ? styles.metricCardWithImage : ''}`}
    >
      <RecapCardHeader title={metric.title} />

      <div className={styles.metricMain}>
        {imageUrl && (
          <SafeImage
            className={styles.image}
            src={imageUrl}
            alt=""
            loading="lazy"
          />
        )}

        <div className={styles.valueSlot}>
          <FitText
            className={`${styles.value} ${styles.highlightValue}`}
            maxFontSize={68}
            minFontSize={18}
          >
            {displayHighlight}
          </FitText>
        </div>
      </div>

      <p className={`${styles.text} ${styles.metricText}`}>
        {renderTextWithHighlight(bodyText, mainHighlight)}
      </p>
    </RecapCardShell>
  );
}

import type { StatsListing } from '../../../entities/stats/types';
import { SafeImage } from '../../../shared/ui/SafeImage/SafeImage';

import { formatNumber } from './formatters';
import styles from './StatisticsPanel.module.css';

type MostViewedListingCardProps = {
  listing: StatsListing | null;
};

export function MostViewedListingCard({
  listing,
}: MostViewedListingCardProps) {
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
        <SafeImage
          src={listing.imageUrl}
          alt=""
          loading="lazy"
          fallback={
            <span
              className={styles.listingImageFallback}
              aria-hidden="true"
            >
              Фото
            </span>
          }
        />
        <div>
          <strong>{listing.name}</strong>
          <span>{listing.city}</span>
          <span>{formatNumber(listing.viewsCount)} просмотров</span>
        </div>
      </div>
    </section>
  );
}

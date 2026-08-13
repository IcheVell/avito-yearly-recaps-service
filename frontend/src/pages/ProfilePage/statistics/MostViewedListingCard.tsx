import type { StatsListing } from '../../../entities/stats/types';
import { SafeImage } from '../../../shared/ui/SafeImage/SafeImage';

import { formatNumber } from './formatters';
import styles from './StatisticsPanel.module.css';

type MostViewedListingCardProps = {
  listing: StatsListing | null;
};

export function MostViewedListingCard({ listing }: MostViewedListingCardProps) {
  if (!listing) {
    return (
      <section className={`${styles.detailCard} ${styles.listingCard}`}>
        <div className={styles.detailCardHeader}>
          <span className={styles.detailIcon} aria-hidden="true">
            ◉
          </span>
          <h3>Популярное объявление</h3>
        </div>
        <p className={styles.muted}>Недостаточно данных.</p>
      </section>
    );
  }

  return (
    <section className={`${styles.detailCard} ${styles.listingCard}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailIcon} aria-hidden="true">
          ◉
        </span>
        <h3>Популярное объявление</h3>
      </div>
      <div className={styles.listingPreview}>
        <div className={styles.listingImageFrame}>
          <SafeImage
            src={listing.imageUrl}
            alt=""
            loading="lazy"
            fallback={
              <span className={styles.listingImageFallback} aria-hidden="true">
                Фото
              </span>
            }
          />
        </div>
        <div className={styles.listingText}>
          <strong>{listing.name}</strong>
          <span>{listing.city}</span>
          <span className={styles.listingViews}>
            <span aria-hidden="true">◉</span>{' '}
            {formatNumber(listing.viewsCount)} просмотров
          </span>
        </div>
      </div>
    </section>
  );
}

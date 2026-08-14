import type { ActionListingPreview } from '../../entities/recap/types';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import styles from './ActionModals.module.css';

export function ListingThumb({ listing }: { listing: ActionListingPreview }) {
  return (
    <SafeImage
      className={styles.cardImage}
      src={listing.imageUrl}
      alt=""
      loading="lazy"
      fallback={
        <div className={styles.cardImageFallback} aria-hidden="true">
          ★
        </div>
      }
    />
  );
}

export function StubButton({
  label,
  className = styles.primaryButton,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button className={className} type="button" onClick={() => undefined}>
      {label}
    </button>
  );
}

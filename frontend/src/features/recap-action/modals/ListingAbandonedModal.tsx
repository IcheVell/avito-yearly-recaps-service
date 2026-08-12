import type { ListingAbandonedAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { ListingThumb, StubButton } from '../ActionModalShared';
import styles from '../ActionModals.module.css';
import {
  type ActionModalProps,
  DEMO_NOTE,
  formatCategory,
} from '../actionModalUtils';
import {
  formatListingPrice,
  listingTitle,
  resolveActionListings,
} from '../listingHelpers';

export function ListingAbandonedModal({
  action,
  onClose,
}: ActionModalProps<ListingAbandonedAction>) {
  const listing = resolveActionListings(
    action.target.listingIds,
    action.target.listings,
  )[0];

  return (
    <Modal
      title="Написать продавцу"
      onClose={onClose}
      footer={<StubButton label="Написать продавцу" />}
    >
      <p className={styles.reason}>{action.reason}</p>

      {!listing ? (
        <p className={styles.emptyState}>Товар не найден в данных действия.</p>
      ) : (
        <div className={styles.card}>
          <ListingThumb listing={listing} />
          <div className={styles.cardBody}>
            <p className={styles.cardTitle}>{listingTitle(listing)}</p>
            <p className={styles.cardMeta}>
              Цена: {formatListingPrice(listing.price)}
            </p>
            <p className={styles.cardMeta}>
              Город: {listing.city?.trim() || '—'}
            </p>
            <p className={styles.cardMeta}>
              Просмотры: {listing.viewsCount ?? 0}
            </p>
            <p className={styles.cardMeta}>
              Категория: {formatCategory(listing.categoryName)}
            </p>
          </div>
        </div>
      )}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

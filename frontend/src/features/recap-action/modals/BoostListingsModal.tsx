import type { BoostListingsAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { ListingThumb, StubButton } from '../ActionModalShared';
import styles from '../ActionModals.module.css';
import {
  type ActionModalProps,
  DEMO_NOTE,
  formatCategory,
} from '../actionModalUtils';
import {
  formatListingDate,
  listingTitle,
  resolveActionListings,
} from '../listingHelpers';

export function BoostListingsModal({
  action,
  onClose,
}: ActionModalProps<BoostListingsAction>) {
  const listings = resolveActionListings(
    action.target.listingIds,
    action.target.listings,
  );

  return (
    <Modal
      title="Обновить объявления"
      onClose={onClose}
      footer={<StubButton label="Обновить" />}
    >
      <p className={styles.reason}>{action.reason}</p>

      {listings.length === 0 ? (
        <p className={styles.emptyState}>Нет объявлений для обновления.</p>
      ) : (
        <ul className={styles.list}>
          {listings.map((listing) => (
            <li key={listing.id} className={styles.card}>
              <ListingThumb listing={listing} />
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{listingTitle(listing)}</p>
                <p className={styles.cardMeta}>
                  Статус: {listing.status ?? 'active'}
                  {' · '}
                  Просмотры: {listing.viewsCount ?? 0}
                </p>
                <p className={styles.cardMeta}>
                  Обновлено: {formatListingDate(listing.updatedAt)}
                </p>
                {(listing.categoryName || listing.categoryId) && (
                  <p className={styles.cardMeta}>
                    Категория: {formatCategory(listing.categoryName)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

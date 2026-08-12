import type { CompareTopAction } from '../../../entities/recap/types';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { StubButton } from '../ActionModalShared';
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

export function CompareTopModal({
  action,
  onClose,
}: ActionModalProps<CompareTopAction>) {
  const listings = resolveActionListings(
    action.target.listingIds,
    action.target.listings,
  );

  return (
    <Modal title="Сравнить топ-3" onClose={onClose} wide>
      <p className={styles.reason}>{action.reason}</p>

      {listings.length === 0 ? (
        <p className={styles.emptyState}>Пока нет объявлений для сравнения.</p>
      ) : (
        <div className={styles.compareTableWrap}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>Объявление</th>
                <th>Цена</th>
                <th>Просмотры</th>
                <th>Категория</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <strong>{listingTitle(listing)}</strong>
                  </td>
                  <td>{formatListingPrice(listing.price)}</td>
                  <td>{listing.viewsCount ?? 0}</td>
                  <td>{formatCategory(listing.categoryName)}</td>
                  <td>
                    <div className={styles.compareActions}>
                      <StubButton
                        label="Открыть объявление"
                        className={styles.secondaryButton}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

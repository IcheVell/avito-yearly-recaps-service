import { Modal } from '../../shared/ui/Modal/Modal';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';
import type {
  ActionListingPreview,
  BoostListingsAction,
  CompareTopAction,
  ContinueSearchAction,
  CreateListingAction,
  ListingAbandonedAction,
  OpenFavoritesAction,
  RecapAction,
} from '../../entities/recap/types';

import styles from './ActionModals.module.css';
import {
  formatListingPrice,
  formatListingDate,
  listingTitle,
  resolveActionListings,
} from './listingHelpers';

type CommonProps = {
  onClose: () => void;
};

const DEMO_NOTE = 'Форма демонстрационная: действие ничего не отправляет.';

function ListingThumb({ listing }: { listing: ActionListingPreview }) {
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

function StubButton({
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

function formatCategory(
  categoryName: string | null | undefined,
): string {
  if (categoryName?.trim()) {
    return categoryName;
  }

  return '—';
}

export function BoostListingsModal({
  action,
  onClose,
}: CommonProps & { action: BoostListingsAction }) {
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
        <p className={styles.emptyState}>
          Нет объявлений для обновления.
        </p>
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
                    Категория:{' '}
                    {formatCategory(listing.categoryName)}
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

export function CreateListingModal({
  action,
  onClose,
}: CommonProps & { action: CreateListingAction }) {
  return (
    <Modal
      title="Создать объявление"
      onClose={onClose}
      footer={
        <>
          <StubButton label="Предпросмотр" className={styles.ghostButton} />
          <StubButton label="Опубликовать" className={styles.secondaryButton} />
        </>
      }
    >
      <p className={styles.reason}>{action.reason}</p>

      <form
        className={styles.createForm}
        onSubmit={(event) => event.preventDefault()}
      >
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Название</span>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="Например, Велосипед в отличном состоянии"
            defaultValue=""
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Категория</span>
          <select className={styles.fieldSelect} defaultValue="">
            <option value="" disabled>
              Выберите категорию
            </option>
            <option value="electronics">Электроника</option>
            <option value="home">Для дома</option>
            <option value="hobby">Хобби и отдых</option>
            <option value="fashion">Одежда и обувь</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Цена, ₽</span>
          <input
            className={styles.fieldInput}
            type="number"
            min={0}
            placeholder="0"
            defaultValue=""
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Описание</span>
          <textarea
            className={styles.fieldTextarea}
            placeholder="Коротко расскажи о товаре, состоянии и городе"
            defaultValue=""
          />
        </label>
      </form>
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

export function ListingAbandonedModal({
  action,
  onClose,
}: CommonProps & { action: ListingAbandonedAction }) {
  const listings = resolveActionListings(
    action.target.listingIds,
    action.target.listings,
  );
  const listing = listings[0];

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
            <p className={styles.cardMeta}>Город: {listing.city?.trim() || '—'}</p>
            <p className={styles.cardMeta}>
              Просмотры: {listing.viewsCount ?? 0}
            </p>
            <p className={styles.cardMeta}>
              Категория:{' '}
              {formatCategory(
                listing.categoryName,
              )}
            </p>
          </div>
        </div>
      )}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

export function CompareTopModal({
  action,
  onClose,
}: CommonProps & { action: CompareTopAction }) {
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
                  <td>
                    {formatCategory(
                      listing.categoryName,
                    )}
                  </td>
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

export function OpenFavoritesModal({
  action,
  onClose,
}: CommonProps & { action: OpenFavoritesAction }) {
  return (
    <Modal
      title="Вернуться к сохранённым"
      onClose={onClose}
      footer={<StubButton label="Открыть избранное" />}
    >
      <p className={styles.reason}>{action.reason}</p>

      {action.target.categoryName ? (
        <p className={styles.categoryFocus}>
          Категория интереса: {action.target.categoryName}
        </p>
      ) : null}
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

export function ContinueSearchModal({
  action,
  onClose,
}: CommonProps & { action: ContinueSearchAction }) {
  return (
    <Modal
      title="Продолжить поиск"
      onClose={onClose}
      footer={<StubButton label="Продолжить" />}
    >
      <p className={styles.reason}>{action.reason}</p>
      <p className={styles.emptyState}>
        Можно продолжить поиск
        {action.target.categoryName
          ? ` в категории «${action.target.categoryName}»`
          : ''}
        .
      </p>
      <div className={styles.linkRow}>
        <StubButton label="Перейти" className={styles.ghostButton} />
      </div>
      <p className={styles.stubNote}>{DEMO_NOTE}</p>
    </Modal>
  );
}

export function RecapActionModal({
  action,
  onClose,
}: {
  action: RecapAction;
  onClose: () => void;
}) {
  switch (action.type) {
    case 'boost_listings':
      return <BoostListingsModal action={action} onClose={onClose} />;
    case 'create_listing':
      return <CreateListingModal action={action} onClose={onClose} />;
    case 'listing_abandoned':
      return <ListingAbandonedModal action={action} onClose={onClose} />;
    case 'compare_top':
      return <CompareTopModal action={action} onClose={onClose} />;
    case 'open_favorites':
      return <OpenFavoritesModal action={action} onClose={onClose} />;
    case 'continue_search':
      return <ContinueSearchModal action={action} onClose={onClose} />;
    default: {
      const exhaustive: never = action;
      throw new Error(`Неизвестное действие: ${JSON.stringify(exhaustive)}`);
    }
  }
}

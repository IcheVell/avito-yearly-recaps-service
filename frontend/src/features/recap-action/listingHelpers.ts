import type { ActionListingPreview } from '../../entities/recap/types';

export function resolveActionListings(
  listingIds: number[] | undefined,
  listings: ActionListingPreview[] | undefined,
): ActionListingPreview[] {
  if (listings && listings.length > 0) {
    return listings;
  }

  return (listingIds ?? []).map((id) => ({ id }));
}

export function formatListingPrice(price: number | null | undefined): string {
  if (price == null) {
    return '—';
  }

  return `${price.toLocaleString('ru-RU')}\u00A0₽`;
}

export function formatListingDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function listingTitle(listing: ActionListingPreview): string {
  return listing.name?.trim() || `Объявление №${listing.id}`;
}

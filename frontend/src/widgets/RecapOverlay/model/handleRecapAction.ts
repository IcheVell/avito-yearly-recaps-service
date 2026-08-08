import type { RecapAction } from '../../../entities/recap/types';

export function handleRecapAction(action: RecapAction) {
  switch (action.type) {
    case 'boost_listings':
      console.info('Boost listings:', {
        listingIds: action.target.listingIds,
        categoryId: action.target.categoryId,
      });
      return;

    case 'create_listing':
      console.info('Create listing');
      return;

    case 'listing_abandoned':
      console.info('Contact listing seller:', {
        listingIds: action.target.listingIds,
        categoryId: action.target.categoryId,
      });
      return;

    case 'compare_top':
      console.info('Compare listings:', {
        listingIds: action.target.listingIds,
        categoryId: action.target.categoryId,
      });
      return;

    case 'open_favorites':
      console.info('Open favorites:', action.target);
      return;

    case 'continue_search':
      console.info('Continue search:', action.target);
      return;

    default: {
      const exhaustiveAction: never = action;
      throw new Error(
        `Неизвестное recap-действие: ${JSON.stringify(
          exhaustiveAction,
        )}`,
      );
    }
  }
}

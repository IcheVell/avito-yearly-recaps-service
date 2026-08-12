import type { RecapAction } from '../../entities/recap/types';

import { BoostListingsModal } from './modals/BoostListingsModal';
import { CompareTopModal } from './modals/CompareTopModal';
import { ContinueSearchModal } from './modals/ContinueSearchModal';
import { CreateListingModal } from './modals/CreateListingModal';
import { ListingAbandonedModal } from './modals/ListingAbandonedModal';
import { OpenFavoritesModal } from './modals/OpenFavoritesModal';

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

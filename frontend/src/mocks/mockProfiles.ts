import type { ProfilesResponse } from '../entities/profile/types';

export const mockProfiles: ProfilesResponse = {
  items: [
    {
      id: 1,
      username: 'seller_anna',
      imageUrl: 'https://i.pravatar.cc/160?img=47',
    },
    {
      id: 2,
      username: 'buyer_igor',
      imageUrl: 'https://i.pravatar.cc/160?img=12',
    },
    {
      id: 3,
      username: 'watcher_maria',
      imageUrl: 'https://i.pravatar.cc/160?img=32',
    },
  ],
};

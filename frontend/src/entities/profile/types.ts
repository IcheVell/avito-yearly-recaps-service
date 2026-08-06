// {
//   "items": [
//     {
//       "id": 1,
//       "username": "seller_anna",
//       "imageUrl": "https://..."
//     },
//     {
//       "id": 2,
//       "username": "buyer_igor",
//       "imageUrl": "https://..."
//     }
//   ]
// }

export type Profile = {
    id: number;
    username: string;
    imageUrl: string;
};

export type ProfilesResponse = {
  items: Profile[];
};
export type Profile = {
    id: number;
    username: string;
    imageUrl: string;
};

export type ProfilesResponse = {
  currentYear: number;
  items: Profile[];
};

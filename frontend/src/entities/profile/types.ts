export type Profile = {
  id: number;
  username: string;
  imageUrl: string | null;
};

export type ProfilesResponse = {
  currentYear: number;
  items: Profile[];
};

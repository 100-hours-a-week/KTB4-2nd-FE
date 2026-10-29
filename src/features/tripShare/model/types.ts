export type TripSharePermission = 'READ' | 'WRITE';

export type ShareUser = {
  userId: number;
  nickname: string;
  email: string;
};

export type TripShare = {
  tripShareId: number;
  user: ShareUser;
  permission: TripSharePermission;
  expiresAt: string;
};

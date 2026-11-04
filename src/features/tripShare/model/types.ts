export type TripSharePermission = 'READ' | 'WRITE';

export type ShareUser = {
  userId: number;
  nickname: string;
  email: string;
};

export type TripShare = {
  tripShareId: number;
  granteeUserId: number;
  email: string;
  permission: TripSharePermission;
  expiresAt: string;
};

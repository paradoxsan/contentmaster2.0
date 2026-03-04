import type { Timestamp } from "firebase/firestore";

export type MetaAccountType = "facebook_page" | "instagram_business";

export interface MetaAccount {
  id: string;
  userId: string;
  metaUserId: string;
  type: MetaAccountType;
  name: string;
  profilePictureUrl: string | null;
  pageId: string | null;
  instagramBusinessAccountId: string | null;
  tokenExpiresAt: Timestamp | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

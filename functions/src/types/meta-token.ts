import type { Timestamp } from "firebase-admin/firestore";

export interface MetaToken {
  id: string;
  userId: string;
  accessToken: string;
  tokenType: "page" | "user";
  expiresAt: Timestamp | null;
  refreshedAt: Timestamp;
  createdAt: Timestamp;
}

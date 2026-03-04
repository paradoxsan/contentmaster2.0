import type { Timestamp } from "firebase-admin/firestore";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  metaAccountIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

import type { Timestamp } from "firebase-admin/firestore";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface ScheduledJob {
  id: string;
  postId: string;
  userId: string;
  scheduledAt: Timestamp;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Timestamp | null;
  errorMessage: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
